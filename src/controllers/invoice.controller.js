const { Invoice, Order, User } = require("../models");
const { generateInvoicePDF } = require("../utils/pdfGenerator");
const { sendInvoiceEmail, sendDueReminderEmail } = require("../utils/emailSender");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const config = require("../config/env");

// Check if using Cloudinary
const useCloudinary = config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret;

/**
 * @desc    Get all invoices
 * @route   GET /api/invoices
 * @access  Admin / User (own invoices)
 */
exports.getAllInvoices = async (req, res) => {
  try {
    const { isPaid, userId, page = 1, limit = 20 } = req.query;
    
    // Build query
    const query = {};
    
    // If user is not admin, show only their invoices
    if (req.user.role !== "ADMIN") {
      query.userId = req.user._id;
    } else if (userId) {
      query.userId = userId;
    }
    
    if (isPaid !== undefined) query.isPaid = isPaid === "true";
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const invoices = await Invoice.find(query)
      .populate("userId", "shopName ownerName email")
      .populate("orderId", "orderNumber")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Invoice.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        invoices,
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
 * @desc    Get single invoice
 * @route   GET /api/invoices/:id
 * @access  Admin / User (own invoice)
 */
exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("userId", "shopName ownerName email phone gstNumber address")
      .populate("orderId");
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found"
      });
    }
    
    // Check authorization
    if (req.user.role !== "ADMIN" && invoice.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }
    
    res.json({
      success: true,
      data: invoice
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Download invoice PDF
 * @route   GET /api/invoices/:id/download
 * @access  Admin / User (own invoice)
 */
exports.downloadInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("userId")
      .populate("orderId");
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found"
      });
    }
    
    // Check authorization
    if (req.user.role !== "ADMIN" && invoice.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }
    
    // Check if PDF needs to be regenerated
    const needsRegeneration = !invoice.pdfPath || 
      (!invoice.pdfPath.startsWith('http') && !fs.existsSync(invoice.pdfPath));
    
    if (needsRegeneration) {
      const pdfPath = await generateInvoicePDF(invoice, invoice.orderId, invoice.userId);
      invoice.pdfPath = pdfPath;
      await invoice.save();
    }
    
    // If Cloudinary URL, redirect to it
    if (invoice.pdfPath.startsWith('http')) {
      return res.redirect(invoice.pdfPath);
    }
    
    // Otherwise, send local file
    res.download(invoice.pdfPath, `${invoice.invoiceNumber}.pdf`);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Resend invoice email
 * @route   POST /api/invoices/:id/resend
 * @access  Admin
 */
exports.resendInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("userId")
      .populate("orderId");
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found"
      });
    }
    
    // Check if user has email
    if (!invoice.userId?.email) {
      return res.status(400).json({
        success: false,
        message: "Customer email not found"
      });
    }
    
    // Regenerate PDF if needed
    const needsRegeneration = !invoice.pdfPath || 
      (!invoice.pdfPath.startsWith('http') && !fs.existsSync(invoice.pdfPath));
    
    if (needsRegeneration) {
      const pdfPath = await generateInvoicePDF(invoice, invoice.orderId, invoice.userId);
      invoice.pdfPath = pdfPath;
    }
    
    // Send email
    try {
      await sendInvoiceEmail(invoice.userId, invoice, invoice.pdfPath);
    } catch (emailError) {
      console.error("Email send error:", emailError);
      return res.status(500).json({
        success: false,
        message: "Email service not configured. Please check SMTP settings in .env file."
      });
    }
    
    invoice.emailSent = true;
    invoice.emailSentAt = new Date();
    await invoice.save();
    
    res.json({
      success: true,
      message: `Invoice sent to ${invoice.userId.email}`
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Send payment reminder
 * @route   POST /api/invoices/:id/reminder
 * @access  Admin
 */
exports.sendReminder = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate("userId");
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found"
      });
    }
    
    if (invoice.isPaid) {
      return res.status(400).json({
        success: false,
        message: "Invoice is already paid"
      });
    }
    
    const now = new Date();
    const dueDate = new Date(invoice.dueDate);
    const daysOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
    
    await sendDueReminderEmail(invoice.userId, invoice, daysOverdue > 0 ? daysOverdue : 0);
    
    invoice.remindersSent += 1;
    invoice.lastReminderAt = now;
    await invoice.save();
    
    res.json({
      success: true,
      message: "Payment reminder sent"
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get overdue invoices
 * @route   GET /api/invoices/overdue
 * @access  Admin
 */
exports.getOverdueInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.getOverdueInvoices();
    
    const totalOverdue = invoices.reduce((sum, inv) => sum + inv.dueAmount, 0);
    
    res.json({
      success: true,
      data: {
        invoices,
        totalOverdue,
        count: invoices.length
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
 * @desc    Update invoice status
 * @route   PUT /api/invoices/:id/status
 * @access  Admin
 */
exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found"
      });
    }
    
    invoice.status = status;
    
    // If marked as paid, update paid amount
    if (status === 'PAID') {
      invoice.isPaid = true;
      invoice.paidAmount = invoice.totalAmount;
      invoice.dueAmount = 0;
    }
    
    await invoice.save();
    
    res.json({
      success: true,
      message: "Invoice status updated",
      data: invoice
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get due soon invoices
 * @route   GET /api/invoices/due-soon
 * @access  Admin
 */
exports.getDueSoonInvoices = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const invoices = await Invoice.getDueSoonInvoices(parseInt(days));
    
    const totalDue = invoices.reduce((sum, inv) => sum + inv.dueAmount, 0);
    
    res.json({
      success: true,
      data: {
        invoices,
        totalDue,
        count: invoices.length
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
