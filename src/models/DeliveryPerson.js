const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const deliveryPersonSchema = new mongoose.Schema(
  {
    // Basic Details
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"]
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false
    },
    address: {
      type: String,
      default: ""
    },
    profilePhoto: {
      type: String,
      default: null
    },
    
    // License & Vehicle Details
    licenseNumber: {
      type: String,
      required: [true, "License number is required"]
    },
    licensePhoto: {
      type: String,
      default: null
    },
    licenseExpiry: {
      type: Date,
      default: null
    },
    transportType: {
      type: String,
      enum: ["BIKE", "SCOOTER", "AUTO", "MINI_TRUCK", "TRUCK", "VAN", "OTHER"],
      required: [true, "Transport type is required"]
    },
    vehicleNumber: {
      type: String,
      required: [true, "Vehicle number is required"]
    },
    vehiclePhoto: {
      type: String,
      default: null
    },
    
    // Work Status
    isActive: {
      type: Boolean,
      default: true
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    currentLocation: {
      lat: Number,
      lng: Number,
      updatedAt: Date
    },
    
    // Earnings & Payments
    totalEarnings: {
      type: Number,
      default: 0
    },
    pendingAmount: {
      type: Number,
      default: 0
    },
    paidAmount: {
      type: Number,
      default: 0
    },
    perDeliveryRate: {
      type: Number,
      default: 50 // Default ₹50 per delivery
    },
    
    // Stats
    totalDeliveries: {
      type: Number,
      default: 0
    },
    successfulDeliveries: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5
    },
    
    // Assigned Orders
    assignedOrders: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order"
    }],
    
    // Order Requests (delivery person requesting to deliver)
    orderRequests: [{
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
      },
      requestedAt: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED"],
        default: "PENDING"
      },
      adminNote: String
    }],
    
    // Verification
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    
    // Created by admin
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
deliveryPersonSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
deliveryPersonSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual for completed deliveries percentage
deliveryPersonSchema.virtual("successRate").get(function () {
  if (this.totalDeliveries === 0) return 100;
  return Math.round((this.successfulDeliveries / this.totalDeliveries) * 100);
});

module.exports = mongoose.model("DeliveryPerson", deliveryPersonSchema);
