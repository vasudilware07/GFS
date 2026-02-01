const { Order, Product, User, Invoice } = require("../models");
const { generateInvoicePDF } = require("../utils/pdfGenerator");
const { sendInvoiceEmail } = require("../utils/emailSender");

/**
 * @desc    Create new order
 * @route   POST /api/orders
 * @access  Private (User)
 */
exports.createOrder = async (req, res) => {
  try {
    const { items, notes, deliveryDate, deliveryAddress } = req.body;
    const userId = req.user._id;
    
    // Check if user is blocked
    if (req.user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account is blocked. Please clear pending dues."
      });
    }
    
    // Validate and calculate order
    let subtotal = 0;
    let gstAmount = 0;
    const orderItems = [];
    
    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.productId}`
        });
      }
      
      if (!product.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Product not available: ${product.name}`
        });
      }
      
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
        });
      }
      
      const itemTotal = product.pricePerUnit * item.quantity;
      const itemGst = (itemTotal * product.gstRate) / 100;
      
      orderItems.push({
        productId: product._id,
        name: product.name,
        unit: product.unit,
        quantity: item.quantity,
        pricePerUnit: product.pricePerUnit,
        gstRate: product.gstRate,
        totalPrice: itemTotal
      });
      
      subtotal += itemTotal;
      gstAmount += itemGst;
      
      // Reduce stock
      product.stock -= item.quantity;
      await product.save();
    }
    
    const totalAmount = subtotal + gstAmount;
    
    // Check credit limit
    const user = await User.findById(userId);
    const newDue = user.currentDue + totalAmount;
    
    if (newDue > user.creditLimit) {
      return res.status(400).json({
        success: false,
        message: `Order exceeds credit limit. Current due: ₹${user.currentDue}, Credit limit: ₹${user.creditLimit}`
      });
    }
    
    // Create order
    const order = await Order.create({
      userId,
      items: orderItems,
      subtotal,
      gstAmount,
      totalAmount,
      dueAmount: totalAmount,
      notes,
      deliveryDate,
      deliveryAddress: deliveryAddress || user.getFullAddress()
    });
    
    // Update user's current due
    user.currentDue = newDue;
    await user.save();
    
    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get all orders
 * @route   GET /api/orders
 * @access  Admin / User (own orders)
 */
exports.getAllOrders = async (req, res) => {
  try {
    const { status, paymentStatus, userId, page = 1, limit = 20 } = req.query;
    
    // Build query
    const query = {};
    
    // If user is not admin, show only their orders
    if (req.user.role !== "ADMIN") {
      query.userId = req.user._id;
    } else if (userId) {
      query.userId = userId;
    }
    
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const orders = await Order.find(query)
      .populate("userId", "shopName ownerName email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Order.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        orders,
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
 * @desc    Get single order
 * @route   GET /api/orders/:id
 * @access  Admin / User (own order)
 */
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId", "shopName ownerName email phone gstNumber address");
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }
    
    // Check authorization
    if (req.user.role !== "ADMIN" && order.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }
    
    res.json({
      success: true,
      data: order
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update order status
 * @route   PUT /api/orders/:id/status
 * @access  Admin
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }
    
    res.json({
      success: true,
      message: "Order status updated",
      data: order
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Cancel order
 * @route   PUT /api/orders/:id/cancel
 * @access  Admin / User (own pending order)
 */
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }
    
    // Check authorization
    if (req.user.role !== "ADMIN" && order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }
    
    // Only pending orders can be cancelled by users
    if (req.user.role !== "ADMIN" && order.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Only pending orders can be cancelled"
      });
    }
    
    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity }
      });
    }
    
    // Update user's due
    const user = await User.findById(order.userId);
    user.currentDue -= order.dueAmount;
    await user.save();
    
    // Update order
    order.status = "CANCELLED";
    await order.save();
    
    res.json({
      success: true,
      message: "Order cancelled",
      data: order
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Generate and send invoice for order
 * @route   POST /api/orders/:id/invoice
 * @access  Admin
 */
exports.generateInvoice = async (req, res) => {
  try {
    const { dueDate, sendEmail = true } = req.body;
    
    const order = await Order.findById(req.params.id).populate("userId");
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }
    
    // Check if invoice already exists
    let invoice = await Invoice.findOne({ orderId: order._id });
    
    if (invoice) {
      return res.status(400).json({
        success: false,
        message: "Invoice already exists for this order",
        data: invoice
      });
    }
    
    // Create invoice
    invoice = await Invoice.create({
      orderId: order._id,
      userId: order.userId._id,
      invoiceDate: new Date(),
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days default
      subtotal: order.subtotal,
      gstAmount: order.gstAmount,
      discount: order.discount,
      totalAmount: order.totalAmount,
      dueAmount: order.dueAmount
    });
    
    // Generate PDF
    const pdfPath = await generateInvoicePDF(invoice, order, order.userId);
    invoice.pdfPath = pdfPath;
    
    // Send email if requested
    if (sendEmail) {
      try {
        await sendInvoiceEmail(order.userId, invoice, pdfPath);
        invoice.emailSent = true;
        invoice.emailSentAt = new Date();
      } catch (emailError) {
        console.error("Failed to send invoice email:", emailError.message);
      }
    }
    
    await invoice.save();
    
    // Update order status
    order.status = "CONFIRMED";
    await order.save();
    
    res.status(201).json({
      success: true,
      message: sendEmail && invoice.emailSent 
        ? "Invoice generated and sent to customer" 
        : "Invoice generated",
      data: invoice
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
