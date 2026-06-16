const crypto = require("crypto");
const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();

const KOLLECT_BACKEND_URL = process.env.KOLLECT_BACKEND_URL
  ? process.env.KOLLECT_BACKEND_URL.replace(/\/$/, "")
  : "";
const KOLLECT_API_KEY = process.env.KOLLECT_API_KEY;
const KOLLECT_SECRET_KEY = process.env.KOLLECT_SECRET_KEY;

// Public config for frontend SDK init (no secrets). Merchant backend only needs: apikey, secretkey, kollect backend url.
router.get("/config", (req, res) => {
  if (!KOLLECT_BACKEND_URL) {
    return res.status(503).json({
      success: false,
      error: "Kollect is not configured. Set KOLLECT_BACKEND_URL on the server.",
    });
  }
  res.json({
    kollectSdkUrl: KOLLECT_BACKEND_URL.replace(/\/$/, ""),
  });
});

router.post("/create-payment", async (req, res) => {
  if (!KOLLECT_API_KEY || !KOLLECT_SECRET_KEY || !KOLLECT_BACKEND_URL) {
    return res.status(500).json({
      success: false,
      error: "KOLLECT_API_KEY, KOLLECT_SECRET_KEY and KOLLECT_BACKEND_URL must be set on the server.",
    });
  }

  const path = "/sdk/server/create-payment";
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const idempotencyKey = req.headers["x-idempotency-key"] || crypto.randomUUID();

  // Signature must cover the exact bytes sent in the body.
  const rawBody = Buffer.from(JSON.stringify(req.body || {}));
  const bodyHash = crypto.createHash("sha256").update(rawBody).digest("hex");
  const baseString = `POST\n${path}\n${timestamp}\n${bodyHash}`;
  const signature = crypto.createHmac("sha256", KOLLECT_SECRET_KEY).update(baseString).digest("hex");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${KOLLECT_API_KEY}`,
    "X-API-Key": KOLLECT_API_KEY,
    "X-Secret-Key": KOLLECT_SECRET_KEY,
    "X-Timestamp": timestamp,
    "X-Signature": signature,
    "X-Idempotency-Key": idempotencyKey,
  };

  try {
    const response = await fetch(`${KOLLECT_BACKEND_URL}${path}`, {
      method: "POST",
      headers,
      body: rawBody.toString("utf8"),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data?.error?.message || data?.message || "Kollect create-payment failed",
      });
    }

    // Forward success response; frontend expects paymentUrl and paymentId (in data or top-level)
    return res.json(data);
  } catch (err) {
    console.error("[Kollect] create-payment proxy error:", err);
    return res.status(502).json({
      success: false,
      error: "Failed to reach Kollect. Please try again.",
    });
  }
});

router.get("/status/:paymentId", async (req, res) => {
  if (!KOLLECT_API_KEY || !KOLLECT_SECRET_KEY || !KOLLECT_BACKEND_URL) {
    return res.status(500).json({
      success: false,
      error: "KOLLECT_API_KEY, KOLLECT_SECRET_KEY and KOLLECT_BACKEND_URL must be set on the server.",
    });
  }

  try {
    const response = await fetch(
      `${KOLLECT_BACKEND_URL}/sdk/server/status/${req.params.paymentId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${KOLLECT_API_KEY}`,
          "X-API-Key": KOLLECT_API_KEY,
          "X-Secret-Key": KOLLECT_SECRET_KEY,
        },
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data?.error?.message || data?.message || "Kollect status check failed",
      });
    }

    return res.json(data);
  } catch (err) {
    console.error("[Kollect] status proxy error:", err);
    return res.status(502).json({ success: false, error: "Failed to reach Kollect. Please try again." });
  }
});

module.exports = router;