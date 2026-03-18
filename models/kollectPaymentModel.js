const mongoose = require("mongoose");

const kollectPaymentSchema = mongoose.Schema(
  {
    // Primary correlation keys (from Kollect responses / webhooks)
    paymentId: { type: String, trim: true, index: true },
    invoiceId: { type: String, trim: true, index: true },
    invoiceNumber: { type: String, trim: true, index: true },
    transactionHash: { type: String, trim: true, index: true },

    // Local metadata
    idempotencyKey: { type: String, trim: true, index: true },
    paymentStatus: {
      type: String,
      required: true,
      trim: true,
      default: "pending",
      index: true,
    },

    // Useful denormalized fields (best-effort)
    amount: { type: mongoose.Schema.Types.Mixed },
    currency: { type: String, trim: true },
    paymentUrl: { type: String, trim: true },

    // Debug / audit
    invoiceRequest: { type: mongoose.Schema.Types.Mixed },
    kollectCreatePaymentResponse: { type: mongoose.Schema.Types.Mixed },
    lastWebhookEvent: { type: String, trim: true },
    lastWebhookPayload: { type: mongoose.Schema.Types.Mixed },
    lastWebhookAt: { type: Date },
  },
  { timestamps: true, collection: "kollect_payments" }
);

// Helps prevent duplicate "pending" rows if the caller retries create-payment.
kollectPaymentSchema.index(
  { idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: "string" } },
  }
);

const KollectPayment = mongoose.model("KollectPayment", kollectPaymentSchema);
module.exports = KollectPayment;

