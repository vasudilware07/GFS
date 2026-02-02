const express = require("express");
const router = express.Router();
const kycController = require("../controllers/kyc.controller");
const { protect, adminOnly } = require("../middlewares");
const { uploadKycDocuments } = require("../middlewares/upload.middleware");

// User routes
router.get("/status", protect, kycController.getKycStatus);
router.post(
  "/submit",
  protect,
  uploadKycDocuments.fields([
    { name: "shopPhoto", maxCount: 1 },
    { name: "ownerPhoto", maxCount: 1 },
    { name: "gstCertificate", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "aadharCard", maxCount: 1 },
    { name: "businessLicense", maxCount: 1 }
  ]),
  kycController.submitKyc
);

// Admin routes
router.get("/admin/all", protect, adminOnly, kycController.getAllKycSubmissions);
router.get("/admin/pending-count", protect, adminOnly, kycController.getPendingKycCount);
router.get("/admin/:userId", protect, adminOnly, kycController.getKycDetails);
router.put("/admin/:userId/approve", protect, adminOnly, kycController.approveKyc);
router.put("/admin/:userId/reject", protect, adminOnly, kycController.rejectKyc);

module.exports = router;
