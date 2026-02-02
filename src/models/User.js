const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["ADMIN", "USER"],
    default: "USER"
  },
  googleId: {
    type: String,
    sparse: true
  },
  avatar: String,
  isVerified: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  shopName: {
    type: String,
    required: [true, "Shop name is required"],
    trim: true
  },
  ownerName: {
    type: String,
    required: [true, "Owner name is required"],
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
  gstNumber: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  creditLimit: {
    type: Number,
    default: 50000
  },
  currentDue: {
    type: Number,
    default: 0
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password not required for Google users
    },
    minlength: 6,
    select: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  // Email OTP Verification
  emailOTP: {
    code: String,
    expiresAt: Date,
    attempts: {
      type: Number,
      default: 0
    }
  },
  // KYC (Know Your Customer) Fields
  kyc: {
    isComplete: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ["PENDING", "SUBMITTED", "APPROVED", "REJECTED"],
      default: "PENDING"
    },
    // User type - business or individual
    userType: {
      type: String,
      enum: ["BUSINESS", "INDIVIDUAL"],
      default: "BUSINESS"
    },
    // Phone number for KYC
    phone: String,
    submittedAt: Date,
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    rejectionReason: String,
    // Business Documents (only ownerPhoto and aadharCard are required)
    documents: {
      ownerPhoto: String,
      aadharCard: String,
      shopPhoto: String,
      gstCertificate: String,
      panCard: String,
      businessLicense: String
    },
    // Business Address
    businessAddress: {
      street: String,
      city: String,
      state: String,
      pincode: String
    },
    // Delivery Address
    deliveryAddress: {
      street: String,
      city: String,
      state: String,
      pincode: String
    },
    sameAsBusinessAddress: {
      type: Boolean,
      default: false
    },
    // Additional Business Info
    businessDetails: {
      businessType: {
        type: String,
        enum: ["RETAILER", "WHOLESALER", "HOTEL_RESTAURANT", "CATERER", "SUPERMARKET", "INDIVIDUAL", "OTHER"]
      },
      yearsInBusiness: Number,
      averageMonthlyPurchase: Number,
      referenceContact: {
        name: String,
        phone: String,
        relation: String
      }
    }
  },
  lastLogin: Date
}, { timestamps: true });

// Hash password before saving
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get full address as string
userSchema.methods.getFullAddress = function() {
  const { street, city, state, pincode } = this.address || {};
  return [street, city, state, pincode].filter(Boolean).join(", ");
};

module.exports = mongoose.model("User", userSchema);
