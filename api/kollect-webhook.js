const crypto = require("crypto");
const express = require("express");
const router = express.Router();

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
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

    // Optional: persist to your DB (e.g. update order/payment status by paymentId or invoiceNumber)
    // await YourModel.updateOne({ paymentId }, { paymentStatus: status, transactionHash });

    res.status(200).json({ success: true, received: true });
  }
);

module.exports = router;
