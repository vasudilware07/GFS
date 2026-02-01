const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoice.controller");
const { protect, adminOnly } = require("../middlewares");

// All routes require authentication
router.use(protect);

// User routes
router.get("/", invoiceController.getAllInvoices);
router.get("/:id", invoiceController.getInvoice);
router.get("/:id/download", invoiceController.downloadInvoice);

// Admin only routes
router.get("/admin/overdue", adminOnly, invoiceController.getOverdueInvoices);
router.get("/admin/due-soon", adminOnly, invoiceController.getDueSoonInvoices);
router.put("/:id/status", adminOnly, invoiceController.updateInvoiceStatus);
router.post("/:id/resend", adminOnly, invoiceController.resendInvoice);
router.post("/:id/reminder", adminOnly, invoiceController.sendReminder);

module.exports = router;
