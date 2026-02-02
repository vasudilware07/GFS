const { User } = require("../models");
const { generateToken } = require("../middlewares");
const { sendWelcomeEmail, sendOTPEmail } = require("../utils/emailSender");

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * @desc    Send OTP to email for verification
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
exports.sendOTP = async (req, res) => {
  try {
    const { email, shopName, ownerName, phone, gstNumber, address, password } = req.body;
    
    // Check if user already exists and is verified
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }
    
    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    if (existingUser) {
      // Update existing unverified user
      existingUser.shopName = shopName;
      existingUser.ownerName = ownerName;
      existingUser.phone = phone;
      existingUser.gstNumber = gstNumber;
      existingUser.address = address;
      existingUser.password = password;
      existingUser.emailOTP = {
        code: otp,
        expiresAt: otpExpiry,
        attempts: 0
      };
      await existingUser.save();
    } else {
      // Create new unverified user
      await User.create({
        shopName,
        ownerName,
        email,
        phone,
        gstNumber,
        address,
        password,
        role: "USER",
        isVerified: false,
        emailOTP: {
          code: otp,
          expiresAt: otpExpiry,
          attempts: 0
        }
      });
    }
    
    // Send OTP email
    await sendOTPEmail(email, ownerName, otp);
    
    res.status(200).json({
      success: true,
      message: "OTP sent to your email"
    });
    
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Verify OTP and complete registration
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found. Please register again."
      });
    }
    
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified"
      });
    }
    
    // Check OTP attempts
    if (user.emailOTP.attempts >= 5) {
      return res.status(400).json({
        success: false,
        message: "Too many attempts. Please request a new OTP."
      });
    }
    
    // Check if OTP expired
    if (new Date() > user.emailOTP.expiresAt) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one."
      });
    }
    
    // Verify OTP
    if (user.emailOTP.code !== otp) {
      user.emailOTP.attempts += 1;
      await user.save();
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }
    
    // Mark as verified
    user.isVerified = true;
    user.emailOTP = undefined;
    await user.save();
    
    // Send welcome email
    sendWelcomeEmail(user).catch(err => console.log("Welcome email failed:", err.message));
    
    // Generate token
    const token = generateToken(user._id);
    
    res.status(200).json({
      success: true,
      message: "Email verified successfully!",
      data: {
        user: {
          id: user._id,
          shopName: user.shopName,
          ownerName: user.ownerName,
          email: user.email,
          role: user.role
        },
        token
      }
    });
    
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Resend OTP
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found. Please register again."
      });
    }
    
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified"
      });
    }
    
    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    
    user.emailOTP = {
      code: otp,
      expiresAt: otpExpiry,
      attempts: 0
    };
    await user.save();
    
    // Send OTP email
    await sendOTPEmail(email, user.ownerName, otp);
    
    res.status(200).json({
      success: true,
      message: "New OTP sent to your email"
    });
    
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Register new user (wholesale buyer)
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    const { shopName, ownerName, email, phone, gstNumber, address, password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }
    
    // Create user
    const user = await User.create({
      shopName,
      ownerName,
      email,
      phone,
      gstNumber,
      address,
      password,
      role: "USER"
    });
    
    // Send welcome email (don't wait for it)
    sendWelcomeEmail(user).catch(err => console.log("Welcome email failed:", err.message));
    
    // Generate token
    const token = generateToken(user._id);
    
    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        user: {
          id: user._id,
          shopName: user.shopName,
          ownerName: user.ownerName,
          email: user.email,
          role: user.role
        },
        token
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password"
      });
    }
    
    // Find user
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }
    
    // Check if active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated. Contact admin."
      });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate token
    const token = generateToken(user._id);
    
    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          shopName: user.shopName,
          ownerName: user.ownerName,
          email: user.email,
          role: user.role,
          isBlocked: user.isBlocked,
          kyc: {
            isComplete: user.kyc?.isComplete || false,
            status: user.kyc?.status || "PENDING"
          }
        },
        token
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      success: true,
      data: user
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/me
 * @access  Private
 */
exports.updateProfile = async (req, res) => {
  try {
    const allowedFields = ["shopName", "ownerName", "phone", "gstNumber"];
    const updates = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    
    // Handle nested address object
    if (req.body.address) {
      updates.address = {
        street: req.body.address.street || '',
        city: req.body.address.city || '',
        state: req.body.address.state || '',
        pincode: req.body.address.pincode || ''
      };
    }
    
    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    });
    
    res.json({
      success: true,
      message: "Profile updated",
      data: user
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user._id).select("+password");
    
    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect"
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({
      success: true,
      message: "Password changed successfully"
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
