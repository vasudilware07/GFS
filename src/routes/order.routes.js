const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const { protect, adminOnly } = require("../middlewares");

// All routes require authentication
router.use(protect);

// User routes
router.post("/", orderController.createOrder);
router.get("/", orderController.getAllOrders);
router.get("/:id", orderController.getOrder);
router.put("/:id/cancel", orderController.cancelOrder);
router.post("/:id/verify-payment", orderController.verifyRazorpayPayment);

// Admin only routes
router.put("/:id/status", adminOnly, orderController.updateOrderStatus);
router.post("/:id/invoice", adminOnly, orderController.generateInvoice);

module.exports = router;
