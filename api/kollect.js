const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();

const AbortController = fetch.AbortController;

const KOLLECT_BACKEND_URL = process.env.KOLLECT_BACKEND_URL
  ? process.env.KOLLECT_BACKEND_URL.replace(/\/$/, "")
  : "";
const KOLLECT_API_KEY = process.env.KOLLECT_API_KEY;
const KOLLECT_SECRET_KEY = process.env.KOLLECT_SECRET_KEY;

const KOLLECT_REQUEST_TIMEOUT_MS = 25000;

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

  const idempotencyKey = req.headers["x-idempotency-key"];
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${KOLLECT_API_KEY}`,
    "X-Secret-Key": KOLLECT_SECRET_KEY,
  };
  if (idempotencyKey) headers["X-Idempotency-Key"] = idempotencyKey;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), KOLLECT_REQUEST_TIMEOUT_MS);

    const response = await fetch(`${KOLLECT_BACKEND_URL}/sdk/server/create-payment`, {
      method: "POST",
      headers,
      body: JSON.stringify(req.body || {}),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

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
    const msg = err.name === "AbortError" ? "Kollect request timed out" : err.message || String(err);
    console.error("[Kollect] create-payment proxy error:", msg, err.cause || "");
    return res.status(502).json({
      success: false,
      error: err.name === "AbortError" ? "Kollect is taking too long. Please try again." : "Failed to reach Kollect. Please try again.",
    });
  }
});

module.exports = router;