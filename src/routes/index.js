const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const productRoutes = require("./product.routes");
const orderRoutes = require("./order.routes");
const invoiceRoutes = require("./invoice.routes");
const paymentRoutes = require("./payment.routes");
const reportRoutes = require("./report.routes");
const kycRoutes = require("./kyc.routes");

// Mount routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/payments", paymentRoutes);
router.use("/reports", reportRoutes);
router.use("/kyc", kycRoutes);

// Health check
router.get("/health", (req, res) => {
  res.json({ 
    success: true, 
    message: "LBR Fruit Suppliers API is running",
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
