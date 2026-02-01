const { Product } = require("../models");

/**
 * @desc    Get all products
 * @route   GET /api/products
 * @access  Public
 */
exports.getAllProducts = async (req, res) => {
  try {
    const { category, search, available, page = 1, limit = 50 } = req.query;
    
    // Build query
    const query = {};
    if (category) query.category = category;
    if (available !== undefined) query.isAvailable = available === "true";
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const products = await Product.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Product.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        products,
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
 * @desc    Get single product
 * @route   GET /api/products/:id
 * @access  Public
 */
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    
    res.json({
      success: true,
      data: product
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Create product
 * @route   POST /api/products
 * @access  Admin
 */
exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    
    res.status(201).json({
      success: true,
      message: "Product created",
      data: product
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 * @access  Admin
 */
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    
    res.json({
      success: true,
      message: "Product updated",
      data: product
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 * @access  Admin
 */
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    
    res.json({
      success: true,
      message: "Product deleted"
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update stock
 * @route   PUT /api/products/:id/stock
 * @access  Admin
 */
exports.updateStock = async (req, res) => {
  try {
    const { stock, operation } = req.body; // operation: 'set', 'add', 'subtract'
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    
    if (operation === "add") {
      product.stock += stock;
    } else if (operation === "subtract") {
      product.stock = Math.max(0, product.stock - stock);
    } else {
      product.stock = stock;
    }
    
    await product.save();
    
    res.json({
      success: true,
      message: "Stock updated",
      data: product
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get low stock products
 * @route   GET /api/products/low-stock
 * @access  Admin
 */
exports.getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.getLowStockProducts();
    
    res.json({
      success: true,
      data: {
        products,
        count: products.length
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
 * @desc    Bulk update prices
 * @route   PUT /api/products/bulk-price
 * @access  Admin
 */
exports.bulkUpdatePrices = async (req, res) => {
  try {
    const { updates } = req.body; // [{ id, pricePerUnit }]
    
    const results = await Promise.all(
      updates.map(async ({ id, pricePerUnit }) => {
        return Product.findByIdAndUpdate(id, { pricePerUnit }, { new: true });
      })
    );
    
    res.json({
      success: true,
      message: `${results.filter(Boolean).length} products updated`,
      data: results.filter(Boolean)
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
