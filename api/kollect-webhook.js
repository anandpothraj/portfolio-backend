const crypto = require("crypto");
const express = require("express");
const router = express.Router();
const KollectPayment = require("../models/kollectPaymentModel");

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["x-kollect-signature"];
    const secret = process.env.KOLLECT_WEBHOOK_SIGNING_SECRET;

    if (!secret) {
      console.error("[Kollect webhook] KOLLECT_WEBHOOK_SIGNING_SECRET not set");
      return res.status(500).json({ success: false, error: "Webhook not configured" });
    }
    if (!signature) {
      return res.status(401).json({ success: false, error: "Missing x-kollect-signature" });
    }

    const rawBody = req.body instanceof Buffer ? req.body.toString("utf8") : (req.body && String(req.body));
    if (!rawBody) {
      return res.status(400).json({ success: false, error: "Empty body" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.warn("[Kollect webhook] Invalid signature");
      return res.status(401).json({ success: false, error: "Invalid signature" });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      return res.status(400).json({ success: false, error: "Invalid JSON" });
    }

    const { paymentId, invoiceId, invoiceNumber, status, event, transactionHash, amount, currency, timestamp } = payload;
    console.log("[Kollect webhook] Payment update:", { paymentId, invoiceNumber, status, event, transactionHash, amount, currency, timestamp });

    try {
      const filterOr = [];
      if (paymentId) filterOr.push({ paymentId: String(paymentId) });
      if (invoiceId) filterOr.push({ invoiceId: String(invoiceId) });
      if (invoiceNumber) filterOr.push({ invoiceNumber: String(invoiceNumber) });

      if (filterOr.length === 0) {
        return res.status(400).json({ success: false, error: "Missing correlation keys" });
      }

      const update = {
        paymentStatus: status || "unknown",
        transactionHash: transactionHash ? String(transactionHash) : undefined,
        amount: amount ?? undefined,
        currency: currency ? String(currency) : undefined,
        lastWebhookEvent: event ? String(event) : undefined,
        lastWebhookPayload: payload,
        lastWebhookAt: timestamp ? new Date(timestamp) : new Date(),
      };

      // Remove undefined keys so we don't overwrite existing values accidentally.
      Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);

      const result = await KollectPayment.updateOne({ $or: filterOr }, { $set: update });

      // If a webhook arrives before the create-payment call is persisted, keep it durable.
      if (result.matchedCount === 0) {
        await KollectPayment.create({
          paymentId: paymentId ? String(paymentId) : undefined,
          invoiceId: invoiceId ? String(invoiceId) : undefined,
          invoiceNumber: invoiceNumber ? String(invoiceNumber) : undefined,
          transactionHash: transactionHash ? String(transactionHash) : undefined,
          paymentStatus: status || "unknown",
          amount,
          currency,
          lastWebhookEvent: event ? String(event) : undefined,
          lastWebhookPayload: payload,
          lastWebhookAt: timestamp ? new Date(timestamp) : new Date(),
        });
      }
    } catch (err) {
      console.error("[Kollect webhook] DB update failed:", err);
      // Return 500 so Kollect can retry delivery.
      return res.status(500).json({ success: false, error: "Failed to persist webhook" });
    }

    res.status(200).json({ success: true, received: true });
  }
);

module.exports = router;
