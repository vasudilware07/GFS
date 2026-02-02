const { DeliveryPerson, DeliveryPaymentRequest, Order } = require("../models");
const jwt = require("jsonwebtoken");
const config = require("../config/env");
const crypto = require("crypto");
const transporter = require("../config/mail");

// Helper to generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ==================== ADMIN OPERATIONS ====================

/**
 * @desc    Create a new delivery person (Admin)
 * @route   POST /api/delivery/persons
 * @access  Admin
 */
exports.createDeliveryPerson = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      address,
      licenseNumber,
      licenseExpiry,
      transportType,
      vehicleNumber,
      perDeliveryRate
    } = req.body;

    // Check if email already exists
    const existingPerson = await DeliveryPerson.findOne({ email });
    if (existingPerson) {
      return res.status(400).json({
        success: false,
        message: "Delivery person with this email already exists"
      });
    }

    // Handle file uploads
    let licensePhoto = null;
    let vehiclePhoto = null;
    let profilePhoto = null;

    if (req.files) {
      const useCloudinary = config.cloudinary?.cloudName && config.cloudinary?.apiKey;
      
      if (req.files.licensePhoto) {
        licensePhoto = useCloudinary 
          ? req.files.licensePhoto[0].path 
          : `/uploads/delivery/${req.files.licensePhoto[0].filename}`;
      }
      if (req.files.vehiclePhoto) {
        vehiclePhoto = useCloudinary 
          ? req.files.vehiclePhoto[0].path 
          : `/uploads/delivery/${req.files.vehiclePhoto[0].filename}`;
      }
      if (req.files.profilePhoto) {
        profilePhoto = useCloudinary 
          ? req.files.profilePhoto[0].path 
          : `/uploads/delivery/${req.files.profilePhoto[0].filename}`;
      }
    }

    const deliveryPerson = await DeliveryPerson.create({
      name,
      email,
      phone,
      password,
      address: address || '',
      licenseNumber,
      licensePhoto,
      licenseExpiry: licenseExpiry || null,
      transportType,
      vehicleNumber,
      vehiclePhoto,
      profilePhoto,
      perDeliveryRate: perDeliveryRate || 50,
      createdBy: req.user._id,
      isVerified: true,
      verifiedBy: req.user._id,
      verifiedAt: new Date()
    });

    // Send welcome email
    try {
      await transporter.sendMail({
        from: config.smtp.from,
        to: email,
        subject: `Welcome to ${config.business.name} - Delivery Partner`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #4CAF50; color: white; padding: 20px; text-align: center;">
              <h1>🚚 Welcome to ${config.business.name}!</h1>
            </div>
            <div style="padding: 20px;">
              <p>Dear <strong>${name}</strong>,</p>
              <p>Your delivery partner account has been created successfully!</p>
              <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Login Credentials:</strong></p>
                <p>Email: ${email}</p>
                <p>Password: ${password}</p>
                <p style="color: #cc0000; font-size: 12px;">Please change your password after first login.</p>
              </div>
              <p>Start delivering and earning today!</p>
              <p>Rate: ₹${perDeliveryRate || 50} per delivery</p>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    res.status(201).json({
      success: true,
      message: "Delivery person created successfully",
      data: {
        ...deliveryPerson.toObject(),
        password: undefined
      }
    });

  } catch (error) {
    console.error("Create delivery person error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get all delivery persons (Admin)
 * @route   GET /api/delivery/persons
 * @access  Admin
 */
exports.getAllDeliveryPersons = async (req, res) => {
  try {
    const { isActive, isAvailable, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (isAvailable !== undefined) query.isAvailable = isAvailable === 'true';

    const deliveryPersons = await DeliveryPerson.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await DeliveryPerson.countDocuments(query);

    res.json({
      success: true,
      data: deliveryPersons,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
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
 * @desc    Get single delivery person (Admin)
 * @route   GET /api/delivery/persons/:id
 * @access  Admin
 */
exports.getDeliveryPerson = async (req, res) => {
  try {
    const deliveryPerson = await DeliveryPerson.findById(req.params.id)
      .select("-password")
      .populate("assignedOrders")
      .populate("createdBy", "name email");

    if (!deliveryPerson) {
      return res.status(404).json({
        success: false,
        message: "Delivery person not found"
      });
    }

    res.json({
      success: true,
      data: deliveryPerson
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update delivery person (Admin)
 * @route   PUT /api/delivery/persons/:id
 * @access  Admin
 */
exports.updateDeliveryPerson = async (req, res) => {
  try {
    const deliveryPerson = await DeliveryPerson.findById(req.params.id);

    if (!deliveryPerson) {
      return res.status(404).json({
        success: false,
        message: "Delivery person not found"
      });
    }

    const updateData = { ...req.body };
    delete updateData.password; // Don't allow password update through this endpoint

    // Handle file uploads
    if (req.files) {
      const useCloudinary = config.cloudinary?.cloudName && config.cloudinary?.apiKey;
      
      if (req.files.licensePhoto) {
        updateData.licensePhoto = useCloudinary 
          ? req.files.licensePhoto[0].path 
          : `/uploads/delivery/${req.files.licensePhoto[0].filename}`;
      }
      if (req.files.vehiclePhoto) {
        updateData.vehiclePhoto = useCloudinary 
          ? req.files.vehiclePhoto[0].path 
          : `/uploads/delivery/${req.files.vehiclePhoto[0].filename}`;
      }
      if (req.files.profilePhoto) {
        updateData.profilePhoto = useCloudinary 
          ? req.files.profilePhoto[0].path 
          : `/uploads/delivery/${req.files.profilePhoto[0].filename}`;
      }
    }

    Object.assign(deliveryPerson, updateData);
    await deliveryPerson.save();

    res.json({
      success: true,
      message: "Delivery person updated successfully",
      data: {
        ...deliveryPerson.toObject(),
        password: undefined
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
 * @desc    Delete/Deactivate delivery person (Admin)
 * @route   DELETE /api/delivery/persons/:id
 * @access  Admin
 */
exports.deleteDeliveryPerson = async (req, res) => {
  try {
    const deliveryPerson = await DeliveryPerson.findById(req.params.id);

    if (!deliveryPerson) {
      return res.status(404).json({
        success: false,
        message: "Delivery person not found"
      });
    }

    // Soft delete - deactivate instead of hard delete
    deliveryPerson.isActive = false;
    await deliveryPerson.save();

    res.json({
      success: true,
      message: "Delivery person deactivated successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Assign order to delivery person (Admin)
 * @route   POST /api/delivery/orders/:orderId/assign
 * @access  Admin
 */
exports.assignOrderToDeliveryPerson = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryPersonId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const deliveryPerson = await DeliveryPerson.findById(deliveryPersonId);
    if (!deliveryPerson) {
      return res.status(404).json({
        success: false,
        message: "Delivery person not found"
      });
    }

    if (!deliveryPerson.isActive) {
      return res.status(400).json({
        success: false,
        message: "Delivery person is not active"
      });
    }

    // Generate OTP for delivery verification
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update order
    order.deliveryPerson = deliveryPersonId;
    order.deliveryAssignedAt = new Date();
    order.deliveryAssignedBy = req.user._id;
    order.deliveryOTP = {
      code: otp,
      expiresAt: otpExpiry,
      verified: false
    };
    order.deliveryEarning = deliveryPerson.perDeliveryRate;
    
    if (order.status === "CONFIRMED" || order.status === "PROCESSING") {
      order.status = "SHIPPED";
    }

    await order.save();

    // Add to delivery person's assigned orders
    if (!deliveryPerson.assignedOrders.includes(orderId)) {
      deliveryPerson.assignedOrders.push(orderId);
      await deliveryPerson.save();
    }

    // Send OTP to customer via email
    const customer = await Order.findById(orderId).populate("userId");
    if (customer?.userId?.email) {
      try {
        await transporter.sendMail({
          from: config.smtp.from,
          to: customer.userId.email,
          subject: `Delivery OTP for Order ${order.orderNumber}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #4CAF50; color: white; padding: 20px; text-align: center;">
                <h1>🚚 Your Order is Out for Delivery!</h1>
              </div>
              <div style="padding: 20px;">
                <p>Order <strong>${order.orderNumber}</strong> is on its way!</p>
                <p>Delivery Partner: <strong>${deliveryPerson.name}</strong></p>
                <p>Phone: <strong>${deliveryPerson.phone}</strong></p>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
                  <p style="margin: 0; font-size: 14px;">Your Delivery OTP:</p>
                  <h1 style="margin: 10px 0; font-size: 36px; letter-spacing: 5px; color: #4CAF50;">${otp}</h1>
                  <p style="margin: 0; font-size: 12px; color: #666;">Share this OTP with the delivery person to confirm delivery.</p>
                </div>
                <p style="color: #cc0000; font-size: 12px;">⚠️ Do not share this OTP with anyone except the delivery person at the time of delivery.</p>
              </div>
            </div>
          `
        });
      } catch (emailError) {
        console.error("Failed to send OTP email:", emailError);
      }
    }

    res.json({
      success: true,
      message: "Order assigned to delivery person",
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        deliveryPerson: {
          id: deliveryPerson._id,
          name: deliveryPerson.name,
          phone: deliveryPerson.phone
        },
        otp: otp // Return OTP for admin reference
      }
    });

  } catch (error) {
    console.error("Assign order error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get orders ready for delivery (Admin)
 * @route   GET /api/delivery/orders/available
 * @access  Admin
 */
exports.getAvailableOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: ["CONFIRMED", "PROCESSING", "SHIPPED"] },
      deliveryPerson: { $exists: false }
    })
    .populate("userId", "name email phone shopName")
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Handle delivery person order request (Admin)
 * @route   PUT /api/delivery/requests/:requestId
 * @access  Admin
 */
exports.handleOrderRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, adminNote, deliveryPersonId } = req.body;

    const deliveryPerson = await DeliveryPerson.findById(deliveryPersonId);
    if (!deliveryPerson) {
      return res.status(404).json({
        success: false,
        message: "Delivery person not found"
      });
    }

    const requestIndex = deliveryPerson.orderRequests.findIndex(
      r => r._id.toString() === requestId
    );

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Request not found"
      });
    }

    deliveryPerson.orderRequests[requestIndex].status = status;
    deliveryPerson.orderRequests[requestIndex].adminNote = adminNote;

    if (status === "APPROVED") {
      // Assign the order to delivery person
      const orderId = deliveryPerson.orderRequests[requestIndex].orderId;
      req.params.orderId = orderId;
      req.body.deliveryPersonId = deliveryPersonId;
      
      // Call assign function internally
      const order = await Order.findById(orderId);
      if (order && !order.deliveryPerson) {
        const otp = generateOTP();
        order.deliveryPerson = deliveryPersonId;
        order.deliveryAssignedAt = new Date();
        order.deliveryAssignedBy = req.user._id;
        order.deliveryOTP = {
          code: otp,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          verified: false
        };
        order.deliveryEarning = deliveryPerson.perDeliveryRate;
        await order.save();

        if (!deliveryPerson.assignedOrders.includes(orderId)) {
          deliveryPerson.assignedOrders.push(orderId);
        }
      }
    }

    await deliveryPerson.save();

    res.json({
      success: true,
      message: `Request ${status.toLowerCase()}`,
      data: deliveryPerson.orderRequests[requestIndex]
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get all pending order requests (Admin)
 * @route   GET /api/delivery/requests
 * @access  Admin
 */
exports.getAllOrderRequests = async (req, res) => {
  try {
    const deliveryPersons = await DeliveryPerson.find({
      "orderRequests.status": "PENDING"
    })
    .select("name phone orderRequests")
    .populate("orderRequests.orderId");

    const pendingRequests = [];
    deliveryPersons.forEach(dp => {
      dp.orderRequests
        .filter(r => r.status === "PENDING")
        .forEach(r => {
          pendingRequests.push({
            requestId: r._id,
            deliveryPersonId: dp._id,
            deliveryPersonName: dp.name,
            deliveryPersonPhone: dp.phone,
            order: r.orderId,
            requestedAt: r.requestedAt
          });
        });
    });

    res.json({
      success: true,
      data: pendingRequests
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== DELIVERY PERSON OPERATIONS ====================

/**
 * @desc    Delivery person login
 * @route   POST /api/delivery/login
 * @access  Public
 */
exports.deliveryPersonLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password"
      });
    }

    const deliveryPerson = await DeliveryPerson.findOne({ email }).select("+password");

    if (!deliveryPerson) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    if (!deliveryPerson.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account has been deactivated. Please contact admin."
      });
    }

    const isMatch = await deliveryPerson.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: deliveryPerson._id, role: "DELIVERY_PERSON" },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({
      success: true,
      message: "Login successful",
      data: {
        deliveryPerson: {
          ...deliveryPerson.toObject(),
          password: undefined
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
 * @desc    Get delivery person profile
 * @route   GET /api/delivery/me
 * @access  Delivery Person
 */
exports.getMyProfile = async (req, res) => {
  try {
    const deliveryPerson = await DeliveryPerson.findById(req.deliveryPerson._id)
      .select("-password");

    res.json({
      success: true,
      data: deliveryPerson
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get my assigned orders
 * @route   GET /api/delivery/my-orders
 * @access  Delivery Person
 */
exports.getMyOrders = async (req, res) => {
  try {
    const { status } = req.query;
    
    const query = { deliveryPerson: req.deliveryPerson._id };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate("userId", "name email phone shopName kyc.businessAddress")
      .populate("items.productId", "name image")
      .sort({ deliveryAssignedAt: -1 });

    res.json({
      success: true,
      data: orders
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Request to deliver an order
 * @route   POST /api/delivery/request-order/:orderId
 * @access  Delivery Person
 */
exports.requestOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (order.deliveryPerson) {
      return res.status(400).json({
        success: false,
        message: "Order already assigned to a delivery person"
      });
    }

    const deliveryPerson = await DeliveryPerson.findById(req.deliveryPerson._id);

    // Check if already requested
    const existingRequest = deliveryPerson.orderRequests.find(
      r => r.orderId.toString() === orderId && r.status === "PENDING"
    );

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "You have already requested this order"
      });
    }

    deliveryPerson.orderRequests.push({
      orderId,
      requestedAt: new Date(),
      status: "PENDING"
    });

    await deliveryPerson.save();

    res.json({
      success: true,
      message: "Order request submitted. Waiting for admin approval."
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update order status (Out for delivery)
 * @route   PUT /api/delivery/orders/:orderId/out-for-delivery
 * @access  Delivery Person
 */
exports.markOutForDelivery = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      deliveryPerson: req.deliveryPerson._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or not assigned to you"
      });
    }

    order.status = "OUT_FOR_DELIVERY";
    await order.save();

    res.json({
      success: true,
      message: "Order marked as out for delivery"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Verify delivery with OTP and photo
 * @route   POST /api/delivery/orders/:orderId/verify
 * @access  Delivery Person
 */
exports.verifyDelivery = async (req, res) => {
  try {
    const { otp } = req.body;
    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      deliveryPerson: req.deliveryPerson._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or not assigned to you"
      });
    }

    // Check OTP
    if (!order.deliveryOTP || order.deliveryOTP.code !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    if (new Date() > order.deliveryOTP.expiresAt) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please contact admin for a new OTP."
      });
    }

    // Handle delivery proof photo
    let deliveryProofPhoto = null;
    if (req.file) {
      const useCloudinary = config.cloudinary?.cloudName && config.cloudinary?.apiKey;
      deliveryProofPhoto = useCloudinary ? req.file.path : `/uploads/delivery/${req.file.filename}`;
    }

    // Update order
    order.deliveryOTP.verified = true;
    order.deliveryOTP.verifiedAt = new Date();
    order.deliveryProofPhoto = deliveryProofPhoto;
    order.status = "DELIVERED";
    order.deliveredAt = new Date();
    order.deliveryNotes = req.body.notes || "";

    await order.save();

    // Update delivery person stats and earnings
    const deliveryPerson = await DeliveryPerson.findById(req.deliveryPerson._id);
    deliveryPerson.totalDeliveries += 1;
    deliveryPerson.successfulDeliveries += 1;
    deliveryPerson.totalEarnings += order.deliveryEarning;
    deliveryPerson.pendingAmount += order.deliveryEarning;
    
    // Remove from assigned orders
    deliveryPerson.assignedOrders = deliveryPerson.assignedOrders.filter(
      id => id.toString() !== orderId
    );
    
    await deliveryPerson.save();

    res.json({
      success: true,
      message: "Delivery verified successfully!",
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        deliveredAt: order.deliveredAt,
        earning: order.deliveryEarning
      }
    });

  } catch (error) {
    console.error("Verify delivery error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get my earnings
 * @route   GET /api/delivery/my-earnings
 * @access  Delivery Person
 */
exports.getMyEarnings = async (req, res) => {
  try {
    const deliveryPerson = await DeliveryPerson.findById(req.deliveryPerson._id)
      .select("totalEarnings pendingAmount paidAmount totalDeliveries successfulDeliveries perDeliveryRate");

    // Get recent deliveries
    const recentDeliveries = await Order.find({
      deliveryPerson: req.deliveryPerson._id,
      status: "DELIVERED"
    })
    .select("orderNumber deliveredAt deliveryEarning")
    .sort({ deliveredAt: -1 })
    .limit(10);

    // Get payment requests
    const paymentRequests = await DeliveryPaymentRequest.find({
      deliveryPerson: req.deliveryPerson._id
    })
    .sort({ createdAt: -1 })
    .limit(10);

    res.json({
      success: true,
      data: {
        earnings: {
          total: deliveryPerson.totalEarnings,
          pending: deliveryPerson.pendingAmount,
          paid: deliveryPerson.paidAmount,
          perDelivery: deliveryPerson.perDeliveryRate
        },
        stats: {
          totalDeliveries: deliveryPerson.totalDeliveries,
          successfulDeliveries: deliveryPerson.successfulDeliveries
        },
        recentDeliveries,
        paymentRequests
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
 * @desc    Request payment withdrawal
 * @route   POST /api/delivery/payment-request
 * @access  Delivery Person
 */
exports.requestPayment = async (req, res) => {
  try {
    const { amount, note } = req.body;
    const deliveryPerson = await DeliveryPerson.findById(req.deliveryPerson._id);

    if (amount > deliveryPerson.pendingAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Your pending amount is ₹${deliveryPerson.pendingAmount}`
      });
    }

    if (amount < 100) {
      return res.status(400).json({
        success: false,
        message: "Minimum withdrawal amount is ₹100"
      });
    }

    const paymentRequest = await DeliveryPaymentRequest.create({
      deliveryPerson: deliveryPerson._id,
      amount,
      requestType: "WITHDRAWAL",
      deliveryPersonNote: note
    });

    res.status(201).json({
      success: true,
      message: "Payment request submitted successfully",
      data: paymentRequest
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update availability status
 * @route   PUT /api/delivery/availability
 * @access  Delivery Person
 */
exports.updateAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;
    
    const deliveryPerson = await DeliveryPerson.findByIdAndUpdate(
      req.deliveryPerson._id,
      { isAvailable },
      { new: true }
    ).select("-password");

    res.json({
      success: true,
      message: `You are now ${isAvailable ? 'available' : 'unavailable'} for deliveries`,
      data: deliveryPerson
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== ADMIN PAYMENT OPERATIONS ====================

/**
 * @desc    Get all payment requests (Admin)
 * @route   GET /api/delivery/payment-requests
 * @access  Admin
 */
exports.getAllPaymentRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const requests = await DeliveryPaymentRequest.find(query)
      .populate("deliveryPerson", "name email phone")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Process payment request (Admin)
 * @route   PUT /api/delivery/payment-requests/:id
 * @access  Admin
 */
exports.processPaymentRequest = async (req, res) => {
  try {
    const { status, paymentMethod, transactionId, adminNote } = req.body;

    const paymentRequest = await DeliveryPaymentRequest.findById(req.params.id);
    if (!paymentRequest) {
      return res.status(404).json({
        success: false,
        message: "Payment request not found"
      });
    }

    paymentRequest.status = status;
    paymentRequest.processedAt = new Date();
    paymentRequest.processedBy = req.user._id;
    paymentRequest.paymentMethod = paymentMethod;
    paymentRequest.transactionId = transactionId;
    paymentRequest.adminNote = adminNote;

    if (status === "PAID") {
      // Update delivery person balance
      const deliveryPerson = await DeliveryPerson.findById(paymentRequest.deliveryPerson);
      deliveryPerson.pendingAmount -= paymentRequest.amount;
      deliveryPerson.paidAmount += paymentRequest.amount;
      await deliveryPerson.save();
    }

    await paymentRequest.save();

    res.json({
      success: true,
      message: `Payment request ${status.toLowerCase()}`,
      data: paymentRequest
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Direct payment to delivery person (Admin)
 * @route   POST /api/delivery/direct-payment
 * @access  Admin
 */
exports.directPayment = async (req, res) => {
  try {
    const { deliveryPersonId, amount, paymentMethod, transactionId, note } = req.body;

    const deliveryPerson = await DeliveryPerson.findById(deliveryPersonId);
    if (!deliveryPerson) {
      return res.status(404).json({
        success: false,
        message: "Delivery person not found"
      });
    }

    // Create payment record
    const paymentRequest = await DeliveryPaymentRequest.create({
      deliveryPerson: deliveryPersonId,
      amount,
      requestType: "ADMIN_PAYMENT",
      status: "PAID",
      paymentMethod,
      transactionId,
      adminNote: note,
      processedAt: new Date(),
      processedBy: req.user._id
    });

    // Update delivery person balance
    const paymentAmount = Math.min(amount, deliveryPerson.pendingAmount);
    deliveryPerson.pendingAmount = Math.max(0, deliveryPerson.pendingAmount - amount);
    deliveryPerson.paidAmount += paymentAmount;
    await deliveryPerson.save();

    res.json({
      success: true,
      message: `Payment of ₹${amount} made successfully`,
      data: paymentRequest
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
