const mongoose = require("mongoose");

const kollectFiatSettlementSchema = mongoose.Schema(
  {
    // Primary correlation keys (from Kollect responses / webhooks)
    paymentId: { type: String, trim: true, index: true },
    invoiceId: { type: String, trim: true, index: true },
    invoiceNumber: { type: String, trim: true, index: true },
    mestaOrderId: { type: String, trim: true, index: true },

    // Local metadata
    idempotencyKey: { type: String, trim: true, index: true },
    paymentStatus: {
      type: String,
      required: true,
      trim: true,
      default: "new",
      index: true,
    },

    // Known at creation time (from what we sent)
    senderWalletAddress: { type: String, trim: true },
    amount: { type: mongoose.Schema.Types.Mixed },
    targetCurrency: { type: String, trim: true },
    // Only known once Mesta assigns a quote/order — filled in by the webhook.
    sourceCurrency: { type: String, trim: true },

    paymentUrl: { type: String, trim: true },
    qrCode: { type: String },

    // Debug / audit
    fiatSettlementRequest: { type: mongoose.Schema.Types.Mixed },
    kollectCreateInvoiceResponse: { type: mongoose.Schema.Types.Mixed },
    lastWebhookEvent: { type: String, trim: true },
    lastWebhookPayload: { type: mongoose.Schema.Types.Mixed },
    lastWebhookAt: { type: Date },
  },
  { timestamps: true, collection: "kollect_fiat_settlements" }
);

// Helps prevent duplicate "new" rows if the caller retries create-invoice.
kollectFiatSettlementSchema.index(
  { idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: "string" } },
  }
);

const KollectFiatSettlement = mongoose.model(
  "KollectFiatSettlement",
  kollectFiatSettlementSchema
);
module.exports = KollectFiatSettlement;
