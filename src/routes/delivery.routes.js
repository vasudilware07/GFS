const express = require("express");
const router = express.Router();
const multer = require("multer");
const deliveryController = require("../controllers/delivery.controller");
const { protect, adminOnly } = require("../middlewares");
const { protectDeliveryPerson } = require("../middlewares/deliveryAuth.middleware");
const config = require("../config/env");

// Check if using Cloudinary
const useCloudinary = config.cloudinary?.cloudName && config.cloudinary?.apiKey && config.cloudinary?.apiSecret;

let deliveryStorage;
if (useCloudinary) {
  const { CloudinaryStorage } = require("multer-storage-cloudinary");
  const cloudinary = require("cloudinary").v2;
  
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret
  });

  deliveryStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "lbr-fruits/delivery",
      allowed_formats: ["jpg", "jpeg", "png", "pdf"],
      resource_type: "auto"
    }
  });
} else {
  const path = require("path");
  const fs = require("fs");
  
  const uploadDir = path.join(process.cwd(), "uploads/delivery");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  deliveryStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/delivery"),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `delivery-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  });
}

const upload = multer({
  storage: deliveryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    if (extname) {
      cb(null, true);
    } else {
      cb(new Error("Only images (jpeg, jpg, png) and PDF are allowed!"), false);
    }
  }
});

// ==================== PUBLIC ROUTES ====================
router.post("/login", deliveryController.deliveryPersonLogin);

// ==================== DELIVERY PERSON ROUTES ====================
router.get("/me", protectDeliveryPerson, deliveryController.getMyProfile);
router.get("/my-orders", protectDeliveryPerson, deliveryController.getMyOrders);
router.get("/my-earnings", protectDeliveryPerson, deliveryController.getMyEarnings);
router.post("/request-order/:orderId", protectDeliveryPerson, deliveryController.requestOrder);
router.put("/orders/:orderId/out-for-delivery", protectDeliveryPerson, deliveryController.markOutForDelivery);
router.post("/orders/:orderId/verify", protectDeliveryPerson, upload.single("deliveryProof"), deliveryController.verifyDelivery);
router.post("/payment-request", protectDeliveryPerson, deliveryController.requestPayment);
router.put("/availability", protectDeliveryPerson, deliveryController.updateAvailability);

// ==================== ADMIN ROUTES ====================
// Delivery person management
router.post(
  "/persons",
  protect,
  adminOnly,
  upload.fields([
    { name: "licensePhoto", maxCount: 1 },
    { name: "vehiclePhoto", maxCount: 1 },
    { name: "profilePhoto", maxCount: 1 }
  ]),
  deliveryController.createDeliveryPerson
);
router.get("/persons", protect, adminOnly, deliveryController.getAllDeliveryPersons);
router.get("/persons/:id", protect, adminOnly, deliveryController.getDeliveryPerson);
router.put(
  "/persons/:id",
  protect,
  adminOnly,
  upload.fields([
    { name: "licensePhoto", maxCount: 1 },
    { name: "vehiclePhoto", maxCount: 1 },
    { name: "profilePhoto", maxCount: 1 }
  ]),
  deliveryController.updateDeliveryPerson
);
router.delete("/persons/:id", protect, adminOnly, deliveryController.deleteDeliveryPerson);

// Order assignment
router.get("/orders/available", protect, adminOnly, deliveryController.getAvailableOrders);
router.post("/orders/:orderId/assign", protect, adminOnly, deliveryController.assignOrderToDeliveryPerson);

// Order requests management
router.get("/requests", protect, adminOnly, deliveryController.getAllOrderRequests);
router.put("/requests/:requestId", protect, adminOnly, deliveryController.handleOrderRequest);

// Payment management
router.get("/payment-requests", protect, adminOnly, deliveryController.getAllPaymentRequests);
router.put("/payment-requests/:id", protect, adminOnly, deliveryController.processPaymentRequest);
router.post("/direct-payment", protect, adminOnly, deliveryController.directPayment);

module.exports = router;
