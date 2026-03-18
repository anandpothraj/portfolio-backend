const crypto = require("crypto");
const fetch = require("node-fetch");
const KollectPayment = require("../models/kollectPaymentModel");

function sha256Hex(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function hmacSha256Hex(secretKey, payload) {
  return crypto.createHmac("sha256", secretKey).update(payload).digest("hex");
}

async function createPayment(invoiceDetails) {
  const baseUrl = (
    process.env.KOLLECT_BACKEND_URL ||
    "http://localhost:5000"
  ).replace(/\/$/, "");
  const path = "/sdk/server/create-payment";
  const url = `${baseUrl}${path}`;

  const apiKey = process.env.KOLLECT_API_KEY;
  const secretKey = process.env.KOLLECT_SECRET_KEY;
  if (!apiKey || !secretKey) {
    throw new Error("Missing env vars: KOLLECT_API_KEY and/or KOLLECT_SECRET_KEY");
  }

  const method = "POST";
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const idempotencyKey = crypto.randomUUID();

  // Important: signature must match the exact bytes sent.
  const rawBody = Buffer.from(JSON.stringify(invoiceDetails));
  const bodyHash = sha256Hex(rawBody);
  const baseString = `${method}\n${path}\n${timestamp}\n${bodyHash}`;
  const signature = hmacSha256Hex(secretKey, baseString);

  const resp = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
      "X-Secret-Key": secretKey,
      "X-Timestamp": timestamp,
      "X-Signature": signature,
      "X-Idempotency-Key": idempotencyKey,
      Authorization: `Bearer ${apiKey}`,
    },
    body: rawBody.toString("utf8"),
  });

  const text = await resp.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!resp.ok) {
    const err = new Error(`Kollect create-payment failed (${resp.status})`);
    err.status = resp.status;
    err.data = data;
    throw err;
  }

  // Persist a "pending" payment row so the webhook can update it later.
  // We intentionally store the raw request + response for easier reconciliation.
  const paymentId = data?.paymentId ?? data?.data?.paymentId ?? data?.result?.paymentId;
  const invoiceId = data?.invoiceId ?? data?.data?.invoiceId ?? data?.result?.invoiceId;
  const invoiceNumber =
    data?.invoiceNumber ?? data?.data?.invoiceNumber ?? data?.result?.invoiceNumber;
  const paymentUrl = data?.paymentUrl ?? data?.data?.paymentUrl ?? data?.result?.paymentUrl;
  const amount = data?.amount ?? data?.data?.amount ?? data?.result?.amount;
  const currency = data?.currency ?? data?.data?.currency ?? data?.result?.currency;

  await KollectPayment.create({
    paymentId,
    invoiceId,
    invoiceNumber,
    idempotencyKey,
    paymentStatus: "pending",
    paymentUrl,
    amount,
    currency,
    invoiceRequest: invoiceDetails,
    kollectCreatePaymentResponse: data,
  });

  return { idempotencyKey, response: data };
}

module.exports = {
  createPayment,
};