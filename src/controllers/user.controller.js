const { User } = require("../models");

/**
 * @desc    Get all users (customers)
 * @route   GET /api/users
 * @access  Admin
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { role, isBlocked, search, page = 1, limit = 20 } = req.query;
    
    // Build query
    const query = {};
    if (role) query.role = role;
    if (isBlocked !== undefined) query.isBlocked = isBlocked === "true";
    if (search) {
      query.$or = [
        { shopName: { $regex: search, $options: "i" } },
        { ownerName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        users,
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
 * @desc    Get single user
 * @route   GET /api/users/:id
 * @access  Admin
 */
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
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
 * @desc    Create new user (by admin)
 * @route   POST /api/users
 * @access  Admin
 */
exports.createUser = async (req, res) => {
  try {
    const { shopName, ownerName, email, phone, gstNumber, address, creditLimit, password, role } = req.body;
    
    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists"
      });
    }
    
    const user = await User.create({
      shopName,
      ownerName,
      email,
      phone,
      gstNumber,
      address,
      creditLimit: creditLimit || 50000,
      password,
      role: role || "USER"
    });
    
    res.status(201).json({
      success: true,
      message: "User created successfully",
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
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Admin
 */
exports.updateUser = async (req, res) => {
  try {
    const updates = req.body;
    
    // Don't allow password update through this route
    delete updates.password;
    
    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    res.json({
      success: true,
      message: "User updated",
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
 * @desc    Block/Unblock user
 * @route   PUT /api/users/:id/block
 * @access  Admin
 */
exports.toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    user.isBlocked = !user.isBlocked;
    await user.save();
    
    res.json({
      success: true,
      message: user.isBlocked ? "User blocked" : "User unblocked",
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
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Admin
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    res.json({
      success: true,
      message: "User deleted"
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update user credit limit
 * @route   PUT /api/users/:id/credit-limit
 * @access  Admin
 */
exports.updateCreditLimit = async (req, res) => {
  try {
    const { creditLimit } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { creditLimit },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    res.json({
      success: true,
      message: "Credit limit updated",
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
 * @desc    Get users with dues
 * @route   GET /api/users/with-dues
 * @access  Admin
 */
exports.getUsersWithDues = async (req, res) => {
  try {
    const users = await User.find({ currentDue: { $gt: 0 } })
      .sort({ currentDue: -1 });
    
    const totalDue = users.reduce((sum, user) => sum + user.currentDue, 0);
    
    res.json({
      success: true,
      data: {
        users,
        totalDue,
        count: users.length
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
