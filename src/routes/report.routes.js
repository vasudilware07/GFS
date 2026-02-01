const express = require("express");
const router = express.Router();
const reportController = require("../controllers/report.controller");
const { protect, adminOnly } = require("../middlewares");

// All routes require admin access
router.use(protect, adminOnly);

router.get("/dashboard", reportController.getDashboard);
router.get("/sales", reportController.getSalesReport);
router.get("/dues", reportController.getDuesReport);
router.get("/top-products", reportController.getTopProducts);
router.get("/profit", reportController.getProfitReport);

module.exports = router;
