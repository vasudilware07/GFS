const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  name: String,
  unit: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  pricePerUnit: {
    type: Number,
    required: true
  },
  gstRate: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  gstAmount: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"],
    default: "PENDING"
  },
  paymentStatus: {
    type: String,
    enum: ["UNPAID", "PARTIAL", "PAID"],
    default: "UNPAID"
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  dueAmount: {
    type: Number,
    default: 0
  },
  notes: String,
  deliveryDate: Date,
  deliveryAddress: String
}, { timestamps: true });

// Generate order number before saving
orderSchema.pre("save", async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model("Order").countDocuments();
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    this.orderNumber = `GFS-${year}${month}-${(count + 1).toString().padStart(4, "0")}`;
  }
  
  // Calculate due amount
  this.dueAmount = this.totalAmount - this.paidAmount;
  
  // Update payment status
  if (this.paidAmount >= this.totalAmount) {
    this.paymentStatus = "PAID";
  } else if (this.paidAmount > 0) {
    this.paymentStatus = "PARTIAL";
  } else {
    this.paymentStatus = "UNPAID";
  }
  
  next();
});

module.exports = mongoose.model("Order", orderSchema);
