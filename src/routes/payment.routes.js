const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const { protect, adminOnly } = require("../middlewares");

// All routes require authentication
router.use(protect);

// User routes
router.get("/", paymentController.getAllPayments);
router.get("/:id", paymentController.getPayment);

// Admin only routes
router.post("/", adminOnly, paymentController.createPayment);
router.post("/:id/resend", adminOnly, paymentController.resendPaymentReceipt);
router.get("/admin/summary", adminOnly, paymentController.getPaymentSummary);

module.exports = router;
