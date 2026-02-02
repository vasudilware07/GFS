const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Product name is required"],
    trim: true
  },
  category: {
    type: String,
    enum: ["FRUITS", "SEASONAL"],
    default: "FRUITS"
  },
  description: {
    type: String,
    trim: true
  },
  unit: {
    type: String,
    enum: ["kg", "box", "crate", "dozen", "piece"],
    default: "kg"
  },
  pricePerUnit: {
    type: Number,
    required: [true, "Price is required"],
    min: 0
  },
  minOrderQuantity: {
    type: Number,
    default: 1
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  // Multiple images support
  images: [{
    type: String
  }],
  // Legacy single image field
  image: {
    type: String
  },
  // Video for quality showcase
  videos: [{
    url: String,
    thumbnail: String,
    duration: Number // in seconds
  }],
  hsnCode: {
    type: String // GST HSN code for fruits
  },
  gstRate: {
    type: Number,
    default: 0 // Most fruits are 0% GST
  }
}, { timestamps: true });

// Virtual to check if low stock
productSchema.virtual("isLowStock").get(function() {
  return this.stock <= this.lowStockThreshold;
});

// Static method to get low stock products
productSchema.statics.getLowStockProducts = function() {
  return this.find({
    $expr: { $lte: ["$stock", "$lowStockThreshold"] }
  });
};

module.exports = mongoose.model("Product", productSchema);
