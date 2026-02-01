const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const { protect, adminOnly } = require("../middlewares");

// Public routes
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProduct);

// Admin only routes
router.get("/admin/low-stock", protect, adminOnly, productController.getLowStockProducts);
router.post("/", protect, adminOnly, productController.createProduct);
router.put("/bulk-price", protect, adminOnly, productController.bulkUpdatePrices);
router.put("/:id", protect, adminOnly, productController.updateProduct);
router.put("/:id/stock", protect, adminOnly, productController.updateStock);
router.delete("/:id", protect, adminOnly, productController.deleteProduct);

module.exports = router;
