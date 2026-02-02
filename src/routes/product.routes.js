const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const { protect, adminOnly } = require("../middlewares");
const { uploadProductMedia } = require("../middlewares/upload.middleware");

// Configure multer to accept both images and videos fields
const uploadFields = uploadProductMedia.fields([
  { name: 'images', maxCount: 5 },
  { name: 'videos', maxCount: 3 }
]);

// Public routes
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProduct);

// Admin only routes
router.get("/admin/low-stock", protect, adminOnly, productController.getLowStockProducts);
router.post("/", protect, adminOnly, uploadFields, productController.createProduct);
router.put("/bulk-price", protect, adminOnly, productController.bulkUpdatePrices);
router.put("/:id", protect, adminOnly, uploadFields, productController.updateProduct);
router.put("/:id/stock", protect, adminOnly, productController.updateStock);
router.delete("/:id/media", protect, adminOnly, productController.deleteProductMedia);
router.delete("/:id", protect, adminOnly, productController.deleteProduct);

module.exports = router;
