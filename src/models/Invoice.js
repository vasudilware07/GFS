const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true
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
  invoiceDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  subtotal: Number,
  gstAmount: Number,
  discount: Number,
  totalAmount: Number,
  paidAmount: {
    type: Number,
    default: 0
  },
  dueAmount: Number,
  isPaid: {
    type: Boolean,
    default: false
  },
  pdfPath: String,
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: Date,
  remindersSent: {
    type: Number,
    default: 0
  },
  lastReminderAt: Date,
  notes: String
}, { timestamps: true });

// Generate invoice number before saving
invoiceSchema.pre("save", async function(next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model("Invoice").countDocuments();
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    this.invoiceNumber = `INV-${year}${month}-${(count + 1).toString().padStart(4, "0")}`;
  }
  
  // Update due amount and paid status
  this.dueAmount = this.totalAmount - this.paidAmount;
  this.isPaid = this.dueAmount <= 0;
  
  next();
});

// Static: Get overdue invoices
invoiceSchema.statics.getOverdueInvoices = function() {
  return this.find({
    isPaid: false,
    dueDate: { $lt: new Date() }
  }).populate("userId orderId");
};

// Static: Get invoices due soon (within X days)
invoiceSchema.statics.getDueSoonInvoices = function(days = 3) {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + days);
  
  return this.find({
    isPaid: false,
    dueDate: { $gte: now, $lte: futureDate }
  }).populate("userId orderId");
};

module.exports = mongoose.model("Invoice", invoiceSchema);
