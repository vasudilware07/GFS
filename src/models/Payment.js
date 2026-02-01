const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  paymentNumber: {
    type: String,
    unique: true
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Invoice",
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  paymentMode: {
    type: String,
    enum: ["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "CREDIT"],
    required: true
  },
  transactionId: String,
  bankName: String,
  chequeNumber: String,
  notes: String,
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User" // Admin who received payment
  }
}, { timestamps: true });

// Generate payment number
paymentSchema.pre("save", async function(next) {
  if (!this.paymentNumber) {
    const count = await mongoose.model("Payment").countDocuments();
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    this.paymentNumber = `PAY-${year}${month}-${(count + 1).toString().padStart(4, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Payment", paymentSchema);
