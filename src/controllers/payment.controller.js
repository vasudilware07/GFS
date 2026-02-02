const { Payment, Invoice, Order, User } = require("../models");
const { sendPaymentConfirmationEmail } = require("../utils/emailSender");

/**
 * @desc    Record a payment
 * @route   POST /api/payments
 * @access  Admin
 */
exports.createPayment = async (req, res) => {
  try {
    const { invoiceId, amount, paymentMode, transactionId, bankName, chequeNumber, notes } = req.body;
    
    // Get invoice - support both ObjectId and Invoice Number
    let invoice;
    const mongoose = require("mongoose");
    
    if (mongoose.Types.ObjectId.isValid(invoiceId)) {
      invoice = await Invoice.findById(invoiceId).populate("userId");
    }
    
    // If not found by ID, try by invoice number
    if (!invoice) {
      invoice = await Invoice.findOne({ invoiceNumber: invoiceId }).populate("userId");
    }
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found. Please enter a valid Invoice ID or Invoice Number"
      });
    }
    
    if (invoice.isPaid) {
      return res.status(400).json({
        success: false,
        message: "Invoice is already fully paid"
      });
    }
    
    if (amount > invoice.dueAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount exceeds due amount. Due: ₹${invoice.dueAmount}`
      });
    }
    
    // Create payment
    const payment = await Payment.create({
      invoiceId: invoice._id,
      orderId: invoice.orderId,
      userId: invoice.userId._id,
      amount,
      paymentMode,
      transactionId,
      bankName,
      chequeNumber,
      notes,
      receivedBy: req.user._id
    });
    
    // Update invoice
    invoice.paidAmount += amount;
    invoice.dueAmount = invoice.totalAmount - invoice.paidAmount;
    invoice.isPaid = invoice.dueAmount <= 0;
    await invoice.save();
    
    // Update order payment status
    const order = await Order.findById(invoice.orderId);
    order.paidAmount += amount;
    order.dueAmount = order.totalAmount - order.paidAmount;
    if (order.paidAmount >= order.totalAmount) {
      order.paymentStatus = "PAID";
    } else if (order.paidAmount > 0) {
      order.paymentStatus = "PARTIAL";
    }
    await order.save();
    
    // Update user's current due
    const user = await User.findById(invoice.userId._id);
    user.currentDue = Math.max(0, user.currentDue - amount);
    
    // Unblock user if dues cleared
    if (user.currentDue === 0 && user.isBlocked) {
      user.isBlocked = false;
    }
    await user.save();
    
    // Send confirmation email
    try {
      await sendPaymentConfirmationEmail(user, payment, invoice);
    } catch (emailError) {
      console.error("Failed to send payment confirmation:", emailError.message);
    }
    
    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: {
        payment,
        invoice: {
          invoiceNumber: invoice.invoiceNumber,
          totalAmount: invoice.totalAmount,
          paidAmount: invoice.paidAmount,
          dueAmount: invoice.dueAmount,
          isPaid: invoice.isPaid
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
 * @desc    Get all payments
 * @route   GET /api/payments
 * @access  Admin / User (own payments)
 */
exports.getAllPayments = async (req, res) => {
  try {
    const { userId, invoiceId, paymentMode, startDate, endDate, page = 1, limit = 20 } = req.query;
    
    // Build query
    const query = {};
    
    // If user is not admin, show only their payments
    if (req.user.role !== "ADMIN") {
      query.userId = req.user._id;
    } else if (userId) {
      query.userId = userId;
    }
    
    if (invoiceId) query.invoiceId = invoiceId;
    if (paymentMode) query.paymentMode = paymentMode;
    
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const payments = await Payment.find(query)
      .populate("userId", "shopName ownerName email")
      .populate("invoiceId", "invoiceNumber")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Payment.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        payments,
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
 * @desc    Get single payment
 * @route   GET /api/payments/:id
 * @access  Admin / User (own payment)
 */
exports.getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("userId", "shopName ownerName email")
      .populate("invoiceId")
      .populate("receivedBy", "ownerName");
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }
    
    // Check authorization
    if (req.user.role !== "ADMIN" && payment.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }
    
    res.json({
      success: true,
      data: payment
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Resend payment receipt email
 * @route   POST /api/payments/:id/resend
 * @access  Admin
 */
exports.resendPaymentReceipt = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("userId")
      .populate("invoiceId");
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }
    
    // Check if user has email
    if (!payment.userId?.email) {
      return res.status(400).json({
        success: false,
        message: "Customer email not found"
      });
    }
    
    // Send confirmation email
    try {
      await sendPaymentConfirmationEmail(payment.userId, payment, payment.invoiceId);
    } catch (emailError) {
      console.error("Email send error:", emailError);
      return res.status(500).json({
        success: false,
        message: "Email service not configured. Please check SMTP settings in .env file."
      });
    }
    
    res.json({
      success: true,
      message: `Payment receipt sent to ${payment.userId.email}`
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get payment summary
 * @route   GET /api/payments/summary
 * @access  Admin
 */
exports.getPaymentSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {};
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }
    
    const payments = await Payment.find(query);
    
    const summary = {
      totalAmount: 0,
      byMode: {},
      count: payments.length
    };
    
    payments.forEach(payment => {
      summary.totalAmount += payment.amount;
      
      if (!summary.byMode[payment.paymentMode]) {
        summary.byMode[payment.paymentMode] = { count: 0, amount: 0 };
      }
      summary.byMode[payment.paymentMode].count += 1;
      summary.byMode[payment.paymentMode].amount += payment.amount;
    });
    
    res.json({
      success: true,
      data: summary
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
