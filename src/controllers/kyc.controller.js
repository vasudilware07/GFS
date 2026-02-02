const { User } = require("../models");
const transporter = require("../config/mail");
const config = require("../config/env");

/**
 * Send KYC approval email
 */
const sendKycApprovalEmail = async (user) => {
  try {
    const mailOptions = {
      from: `"LBR Fruit Suppliers" <${config.smtp.user}>`,
      to: user.email,
      subject: "🎉 KYC Verified - Welcome to LBR Fruit Suppliers!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; margin: 0;">LBR Fruit Suppliers</h1>
            <p style="color: #666; margin-top: 5px;">Your Trusted Fruit Partner</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 25px;">
            <h2 style="margin: 0 0 10px 0;">✅ KYC Verified Successfully!</h2>
            <p style="margin: 0; opacity: 0.9;">Your account is now fully activated</p>
          </div>
          
          <p style="color: #333; font-size: 16px;">Dear <strong>${user.ownerName}</strong>,</p>
          
          <p style="color: #555; line-height: 1.6;">
            Great news! Your KYC verification has been approved. You can now enjoy all the benefits of being a verified member:
          </p>
          
          <ul style="color: #555; line-height: 2;">
            <li>✓ Place unlimited orders</li>
            <li>✓ Access to bulk pricing</li>
            <li>✓ Credit facility (based on eligibility)</li>
            <li>✓ Priority customer support</li>
            <li>✓ Special seasonal offers</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${config.frontendUrl}/products" style="background: #16a34a; color: white; padding: 14px 35px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
              Start Shopping Now
            </a>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            If you have any questions, feel free to contact us at <a href="mailto:support@lbrfruits.com" style="color: #16a34a;">support@lbrfruits.com</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} LBR Fruit Suppliers. All rights reserved.<br>
            This is an automated message, please do not reply.
          </p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Failed to send KYC approval email:", error.message);
    return false;
  }
};

/**
 * Send KYC rejection email
 */
const sendKycRejectionEmail = async (user, reason) => {
  try {
    const mailOptions = {
      from: `"LBR Fruit Suppliers" <${config.smtp.user}>`,
      to: user.email,
      subject: "KYC Verification Update - Action Required",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; margin: 0;">LBR Fruit Suppliers</h1>
            <p style="color: #666; margin-top: 5px;">Your Trusted Fruit Partner</p>
          </div>
          
          <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
            <h2 style="color: #dc2626; margin: 0 0 10px 0;">⚠️ KYC Verification Unsuccessful</h2>
            <p style="color: #991b1b; margin: 0;">Your KYC submission requires some corrections</p>
          </div>
          
          <p style="color: #333; font-size: 16px;">Dear <strong>${user.ownerName}</strong>,</p>
          
          <p style="color: #555; line-height: 1.6;">
            Unfortunately, we were unable to verify your KYC documents. Please see the reason below:
          </p>
          
          <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
            <p style="color: #374151; margin: 0;"><strong>Reason:</strong> ${reason}</p>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            Please re-submit your KYC with the correct documents. We're here to help if you need any assistance.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${config.frontendUrl}/kyc" style="background: #16a34a; color: white; padding: 14px 35px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
              Re-submit KYC
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} LBR Fruit Suppliers. All rights reserved.
          </p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Failed to send KYC rejection email:", error.message);
    return false;
  }
};

/**
 * @desc    Get KYC status
 * @route   GET /api/kyc/status
 * @access  User
 */
exports.getKycStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("kyc shopName ownerName email phone");
    
    res.json({
      success: true,
      data: {
        isComplete: user.kyc?.isComplete || false,
        status: user.kyc?.status || "PENDING",
        userType: user.kyc?.userType || "BUSINESS",
        phone: user.kyc?.phone || "",
        documents: user.kyc?.documents || {},
        businessDetails: user.kyc?.businessDetails || {},
        businessAddress: user.kyc?.businessAddress || {},
        deliveryAddress: user.kyc?.deliveryAddress || {},
        sameAsBusinessAddress: user.kyc?.sameAsBusinessAddress || false,
        rejectionReason: user.kyc?.rejectionReason,
        submittedAt: user.kyc?.submittedAt,
        verifiedAt: user.kyc?.verifiedAt
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
 * @desc    Submit KYC
 * @route   POST /api/kyc/submit
 * @access  User
 */
exports.submitKyc = async (req, res) => {
  try {
    const { businessDetails, businessAddress, deliveryAddress, sameAsBusinessAddress, phone, userType } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Check if KYC is already approved
    if (user.kyc?.status === "APPROVED") {
      return res.status(400).json({
        success: false,
        message: "KYC already approved"
      });
    }
    
    // Initialize KYC object if not exists
    if (!user.kyc) {
      user.kyc = {
        isComplete: false,
        status: "PENDING",
        userType: "BUSINESS",
        phone: "",
        documents: {},
        businessDetails: {},
        businessAddress: {},
        deliveryAddress: {}
      };
    }
    
    // Update user type (BUSINESS or INDIVIDUAL)
    if (userType) {
      user.kyc.userType = userType;
    }
    
    // Update phone number
    if (phone) {
      user.kyc.phone = phone;
    }
    
    // Update business details
    if (businessDetails) {
      user.kyc.businessDetails = {
        ...user.kyc.businessDetails,
        ...JSON.parse(typeof businessDetails === 'string' ? businessDetails : JSON.stringify(businessDetails))
      };
    }
    
    // Update business address
    if (businessAddress) {
      user.kyc.businessAddress = JSON.parse(typeof businessAddress === 'string' ? businessAddress : JSON.stringify(businessAddress));
    }
    
    // Update delivery address
    if (deliveryAddress) {
      user.kyc.deliveryAddress = JSON.parse(typeof deliveryAddress === 'string' ? deliveryAddress : JSON.stringify(deliveryAddress));
    }
    
    // Update same as business address flag
    user.kyc.sameAsBusinessAddress = sameAsBusinessAddress === 'true' || sameAsBusinessAddress === true;
    
    // Handle uploaded documents (supports both array and fields format)
    if (req.files) {
      // If using upload.fields()
      if (!Array.isArray(req.files)) {
        Object.keys(req.files).forEach(fieldName => {
          const files = req.files[fieldName];
          if (files && files.length > 0) {
            const fileUrl = `/uploads/kyc/documents/${files[0].filename}`;
            user.kyc.documents[fieldName] = fileUrl;
          }
        });
      } else {
        // If using upload.array()
        req.files.forEach(file => {
          const fileUrl = `/uploads/kyc/documents/${file.filename}`;
          user.kyc.documents[file.fieldname] = fileUrl;
        });
      }
    }
    
    // Check if required documents are uploaded (only ownerPhoto and aadharCard are required)
    const requiredDocs = ["ownerPhoto", "aadharCard"];
    const hasRequiredDocs = requiredDocs.every(doc => user.kyc.documents[doc]);
    
    // Check if address is filled
    const hasBusinessAddress = user.kyc.businessAddress?.street && 
                               user.kyc.businessAddress?.city && 
                               user.kyc.businessAddress?.state && 
                               user.kyc.businessAddress?.pincode;
    
    if (hasRequiredDocs && hasBusinessAddress && user.kyc.businessDetails?.businessType) {
      user.kyc.status = "SUBMITTED";
      user.kyc.submittedAt = new Date();
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: user.kyc.status === "SUBMITTED" ? "KYC submitted for verification" : "KYC details saved",
      data: {
        status: user.kyc.status,
        documents: user.kyc.documents,
        businessDetails: user.kyc.businessDetails
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
 * @desc    Get all KYC submissions (Admin)
 * @route   GET /api/kyc/admin/all
 * @access  Admin
 */
exports.getAllKycSubmissions = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = { "kyc.status": { $ne: "PENDING" } };
    if (status) {
      query["kyc.status"] = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find(query)
      .select("shopName ownerName email phone kyc createdAt")
      .sort({ "kyc.submittedAt": -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        submissions: users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
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
 * @desc    Get pending KYC count (Admin)
 * @route   GET /api/kyc/admin/pending-count
 * @access  Admin
 */
exports.getPendingKycCount = async (req, res) => {
  try {
    const count = await User.countDocuments({ "kyc.status": "SUBMITTED" });
    
    res.json({
      success: true,
      data: { count }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get single KYC details (Admin)
 * @route   GET /api/kyc/admin/:userId
 * @access  Admin
 */
exports.getKycDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("shopName ownerName email phone gstNumber address kyc createdAt");
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
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
 * @desc    Approve KYC (Admin)
 * @route   PUT /api/kyc/admin/:userId/approve
 * @access  Admin
 */
exports.approveKyc = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    if (user.kyc?.status !== "SUBMITTED") {
      return res.status(400).json({
        success: false,
        message: "KYC is not in submitted status"
      });
    }
    
    user.kyc.status = "APPROVED";
    user.kyc.isComplete = true;
    user.kyc.verifiedAt = new Date();
    user.kyc.verifiedBy = req.user._id;
    user.kyc.rejectionReason = null;
    user.isApproved = true;
    
    await user.save();
    
    // Send approval email to user
    const emailSent = await sendKycApprovalEmail(user);
    
    res.json({
      success: true,
      message: emailSent ? "KYC approved successfully and email sent" : "KYC approved successfully (email failed)",
      data: {
        userId: user._id,
        shopName: user.shopName,
        status: user.kyc.status,
        emailSent
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
 * @desc    Reject KYC (Admin)
 * @route   PUT /api/kyc/admin/:userId/reject
 * @access  Admin
 */
exports.rejectKyc = async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required"
      });
    }
    
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    user.kyc.status = "REJECTED";
    user.kyc.isComplete = false;
    user.kyc.rejectionReason = reason;
    user.kyc.verifiedAt = new Date();
    user.kyc.verifiedBy = req.user._id;
    
    await user.save();
    
    // Send rejection email to user
    const emailSent = await sendKycRejectionEmail(user, reason);
    
    res.json({
      success: true,
      message: emailSent ? "KYC rejected and email sent" : "KYC rejected (email failed)",
      data: {
        userId: user._id,
        shopName: user.shopName,
        status: user.kyc.status,
        reason,
        emailSent
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
