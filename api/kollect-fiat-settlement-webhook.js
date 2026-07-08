const crypto = require("crypto");
const express = require("express");
const router = express.Router();
const KollectFiatSettlement = require("../models/kollectFiatSettlementModel");

router.post(
  "/webhook/fiat-settlement",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    // Since the 2026-07 webhook unification, x-kollect-signature-v2 carries
    // the "sha256="-prefixed HMAC and x-kollect-signature the raw hex (same
    // as invoice_settlement). Prefer v2, fall back to the raw-hex header.
    const signatureHeader =
      req.headers["x-kollect-signature-v2"] || req.headers["x-kollect-signature"];
    const secret = process.env.KOLLECT_FIAT_WEBHOOK_SIGNING_SECRET;

    if (!secret) {
      console.error("[Kollect fiat-settlement webhook] KOLLECT_FIAT_WEBHOOK_SIGNING_SECRET not set");
      return res.status(500).json({ success: false, error: "Webhook not configured" });
    }
    if (!signatureHeader) {
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

    const receivedSignature = signatureHeader.startsWith("sha256=")
      ? signatureHeader.slice("sha256=".length)
      : signatureHeader;

    const receivedBuf = Buffer.from(receivedSignature);
    const expectedBuf = Buffer.from(expectedSignature);
    if (
      receivedBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(receivedBuf, expectedBuf)
    ) {
      console.warn("[Kollect fiat-settlement webhook] Invalid signature");
      return res.status(401).json({ success: false, error: "Invalid signature" });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      return res.status(400).json({ success: false, error: "Invalid JSON" });
    }

    const {
      paymentId,
      invoiceNumber,
      status,
      event,
      amount,
      sourceCurrency,
      targetCurrency,
      mestaOrderId,
      timestamp,
    } = payload;
    console.log("[Kollect fiat-settlement webhook] Settlement update:", {
      paymentId,
      invoiceNumber,
      status,
      event,
      amount,
      sourceCurrency,
      targetCurrency,
      mestaOrderId,
      timestamp,
    });

    try {
      const filterOr = [];
      if (paymentId) filterOr.push({ paymentId: String(paymentId) });
      if (invoiceNumber) filterOr.push({ invoiceNumber: String(invoiceNumber) });

      if (filterOr.length === 0) {
        return res.status(400).json({ success: false, error: "Missing correlation keys" });
      }

      const update = {
        paymentStatus: status || "unknown",
        sourceCurrency: sourceCurrency ? String(sourceCurrency) : undefined,
        targetCurrency: targetCurrency ? String(targetCurrency) : undefined,
        amount: amount ?? undefined,
        mestaOrderId: mestaOrderId ? String(mestaOrderId) : undefined,
        lastWebhookEvent: event ? String(event) : undefined,
        lastWebhookPayload: payload,
        lastWebhookAt: timestamp ? new Date(timestamp) : new Date(),
      };

      // Remove undefined keys so we don't overwrite existing values accidentally.
      Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);

      const result = await KollectFiatSettlement.updateOne({ $or: filterOr }, { $set: update });

      // If a webhook arrives before the create-invoice call is persisted, keep it durable.
      if (result.matchedCount === 0) {
        await KollectFiatSettlement.create({
          paymentId: paymentId ? String(paymentId) : undefined,
          invoiceNumber: invoiceNumber ? String(invoiceNumber) : undefined,
          paymentStatus: status || "unknown",
          amount,
          sourceCurrency,
          targetCurrency,
          mestaOrderId: mestaOrderId ? String(mestaOrderId) : undefined,
          lastWebhookEvent: event ? String(event) : undefined,
          lastWebhookPayload: payload,
          lastWebhookAt: timestamp ? new Date(timestamp) : new Date(),
        });
      }
    } catch (err) {
      console.error("[Kollect fiat-settlement webhook] DB update failed:", err);
      // Return 500 so Kollect can retry delivery.
      return res.status(500).json({ success: false, error: "Failed to persist webhook" });
    }

    res.status(200).json({ success: true, received: true });
  }
);

module.exports = router;
