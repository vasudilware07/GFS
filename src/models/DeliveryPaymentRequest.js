const mongoose = require("mongoose");

const paymentRequestSchema = new mongoose.Schema(
  {
    deliveryPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryPerson",
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    requestType: {
      type: String,
      enum: ["WITHDRAWAL", "ADMIN_PAYMENT"],
      default: "WITHDRAWAL"
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "PAID"],
      default: "PENDING"
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    processedAt: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    paymentMethod: {
      type: String,
      enum: ["CASH", "BANK_TRANSFER", "UPI"],
      default: "CASH"
    },
    transactionId: String,
    adminNote: String,
    deliveryPersonNote: String
  },
  {
    timestamps: true
  }
);

// Generate unique request number
paymentRequestSchema.pre("save", async function (next) {
  if (!this.requestNumber) {
    const count = await this.constructor.countDocuments();
    this.requestNumber = `PR-${String(count + 1).padStart(6, "0")}`;
  }
  next();
});

module.exports = mongoose.model("DeliveryPaymentRequest", paymentRequestSchema);
