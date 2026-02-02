const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    "uploads",
    "uploads/products",
    "uploads/products/images",
    "uploads/products/videos",
    "uploads/kyc",
    "uploads/kyc/documents"
  ];
  
  dirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
};

createUploadDirs();

// Storage configuration for product images
const productImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/products/images");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `product-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Storage configuration for product videos
const productVideoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/products/videos");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `video-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Storage configuration for KYC documents
const kycStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/kyc/documents");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `kyc-${req.user._id}-${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter for images
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (jpeg, jpg, png, gif, webp) are allowed!"), false);
  }
};

// File filter for videos
const videoFilter = (req, file, cb) => {
  const allowedTypes = /mp4|webm|mov|avi|mkv/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype.startsWith("video/");
  
  if (extname || mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only video files (mp4, webm, mov, avi, mkv) are allowed!"), false);
  }
};

// File filter for documents (images + PDF)
const documentFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  if (extname) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (jpeg, jpg, png) and PDF are allowed!"), false);
  }
};

// Product image upload middleware
const uploadProductImages = multer({
  storage: productImageStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for images
    files: 5 // Max 5 images
  }
});

// Product video upload middleware
const uploadProductVideos = multer({
  storage: productVideoStorage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
    files: 3 // Max 3 videos
  }
});

// Combined product media upload
const productMediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, "uploads/products/videos");
    } else {
      cb(null, "uploads/products/images");
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const prefix = file.mimetype.startsWith("video/") ? "video" : "image";
    cb(null, `${prefix}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const mediaFilter = (req, file, cb) => {
  const imageTypes = /jpeg|jpg|png|gif|webp/;
  const videoTypes = /mp4|webm|mov|avi|mkv/;
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (imageTypes.test(ext) || videoTypes.test(ext) || file.mimetype.startsWith("video/") || file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image and video files are allowed!"), false);
  }
};

const uploadProductMedia = multer({
  storage: productMediaStorage,
  fileFilter: mediaFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 8 // Max 8 files (5 images + 3 videos)
  }
});

// KYC document upload middleware
const uploadKycDocuments = multer({
  storage: kycStorage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 6 // Max 6 documents
  }
});

module.exports = {
  uploadProductImages,
  uploadProductVideos,
  uploadProductMedia,
  uploadKycDocuments
};
