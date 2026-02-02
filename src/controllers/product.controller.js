const { Product } = require("../models");
const fs = require("fs");
const path = require("path");

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
    const productData = { ...req.body };
    
    // Map 'price' to 'pricePerUnit' if sent from frontend
    if (productData.price && !productData.pricePerUnit) {
      productData.pricePerUnit = parseFloat(productData.price);
      delete productData.price;
    }
    
    // Handle uploaded files (when using upload.fields())
    const images = [];
    const videos = [];
    
    if (req.files) {
      // Handle images
      if (req.files.images && req.files.images.length > 0) {
        req.files.images.forEach(file => {
          const fileUrl = `/uploads/${file.destination.split("uploads/")[1]}/${file.filename}`;
          images.push(fileUrl);
        });
      }
      
      // Handle videos
      if (req.files.videos && req.files.videos.length > 0) {
        req.files.videos.forEach(file => {
          const fileUrl = `/uploads/${file.destination.split("uploads/")[1]}/${file.filename}`;
          videos.push({
            url: fileUrl,
            thumbnail: null,
            duration: null
          });
        });
      }
    }
    
    if (images.length > 0) {
      productData.images = images;
      productData.image = images[0]; // Set first image as main image
    }
    if (videos.length > 0) {
      productData.videos = videos;
    }
    
    const product = await Product.create(productData);
    
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
    const productData = { ...req.body };
    
    // Map 'price' to 'pricePerUnit' if sent from frontend
    if (productData.price && !productData.pricePerUnit) {
      productData.pricePerUnit = parseFloat(productData.price);
      delete productData.price;
    }
    
    // Get existing product
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    
    // Parse existing media arrays from request
    let existingImages = [];
    let existingVideos = [];
    let imagesToDelete = [];
    let videosToDelete = [];
    
    try {
      if (req.body.existingImages) {
        existingImages = JSON.parse(req.body.existingImages);
      }
      if (req.body.existingVideos) {
        existingVideos = JSON.parse(req.body.existingVideos);
      }
      if (req.body.imagesToDelete) {
        imagesToDelete = JSON.parse(req.body.imagesToDelete);
      }
      if (req.body.videosToDelete) {
        videosToDelete = JSON.parse(req.body.videosToDelete);
      }
    } catch (e) {
      console.log("Error parsing media arrays:", e.message);
    }
    
    // Clean up these fields from productData
    delete productData.existingImages;
    delete productData.existingVideos;
    delete productData.imagesToDelete;
    delete productData.videosToDelete;
    
    // Handle uploaded files (when using upload.fields())
    const newImages = [];
    const newVideos = [];
    
    if (req.files) {
      // Handle images
      if (req.files.images && req.files.images.length > 0) {
        req.files.images.forEach(file => {
          const fileUrl = `/uploads/${file.destination.split("uploads/")[1]}/${file.filename}`;
          newImages.push(fileUrl);
        });
      }
      
      // Handle videos
      if (req.files.videos && req.files.videos.length > 0) {
        req.files.videos.forEach(file => {
          const fileUrl = `/uploads/${file.destination.split("uploads/")[1]}/${file.filename}`;
          newVideos.push({
            url: fileUrl,
            thumbnail: null,
            duration: null
          });
        });
      }
    }
    
    // Combine existing (kept) images with new ones
    productData.images = [...existingImages, ...newImages];
    productData.image = productData.images[0] || null;
    
    // Combine existing (kept) videos with new ones
    productData.videos = [...existingVideos, ...newVideos];
    
    // Delete files marked for deletion
    imagesToDelete.forEach(imgUrl => {
      try {
        const filePath = path.join(process.cwd(), imgUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {
        console.log("Could not delete image file:", e.message);
      }
    });
    
    videosToDelete.forEach(videoUrl => {
      try {
        const url = typeof videoUrl === 'object' ? videoUrl.url : videoUrl;
        const filePath = path.join(process.cwd(), url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {
        console.log("Could not delete video file:", e.message);
      }
    });
    
    const product = await Product.findByIdAndUpdate(req.params.id, productData, {
      new: true,
      runValidators: true
    });
    
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
 * @desc    Delete product media (image/video)
 * @route   DELETE /api/products/:id/media
 * @access  Admin
 */
exports.deleteProductMedia = async (req, res) => {
  try {
    const { type, url } = req.body; // type: 'image' or 'video'
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    
    if (type === "image") {
      product.images = product.images.filter(img => img !== url);
      if (product.image === url) {
        product.image = product.images[0] || null;
      }
    } else if (type === "video") {
      product.videos = product.videos.filter(vid => vid.url !== url);
    }
    
    await product.save();
    
    // Try to delete the file from disk
    try {
      const filePath = path.join(process.cwd(), url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.log("Could not delete file:", e.message);
    }
    
    res.json({
      success: true,
      message: "Media deleted",
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
