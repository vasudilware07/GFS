const multer = require("multer");
const path = require("path");
const config = require("../config/env");

// Check if Cloudinary is configured
const useCloudinary = config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret;

let storage;
if (useCloudinary) {
  // Use Cloudinary storage in production
  const { productImageStorage, productVideoStorage, kycDocumentStorage, productMediaStorage } = require("../config/cloudinary");
  storage = { productImageStorage, productVideoStorage, kycDocumentStorage, productMediaStorage };
} else {
  // Use local storage for development
  const fs = require("fs");
  
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
  
  storage = {
    productImageStorage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, "uploads/products/images"),
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `product-${uniqueSuffix}${path.extname(file.originalname)}`);
      }
    }),
    productVideoStorage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, "uploads/products/videos"),
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `video-${uniqueSuffix}${path.extname(file.originalname)}`);
      }
    }),
    kycDocumentStorage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, "uploads/kyc/documents"),
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `kyc-${req.user._id}-${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
      }
    }),
    productMediaStorage: multer.diskStorage({
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
    })
  };
}

// File filters
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

const documentFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  if (extname) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (jpeg, jpg, png) and PDF are allowed!"), false);
  }
};

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

// Upload middlewares
const uploadProductImages = multer({
  storage: storage.productImageStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5
  }
});

const uploadProductVideos = multer({
  storage: storage.productVideoStorage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 3
  }
});

const uploadProductMedia = multer({
  storage: storage.productMediaStorage,
  fileFilter: mediaFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 8
  }
});

const uploadKycDocuments = multer({
  storage: storage.kycDocumentStorage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 6
  }
});

module.exports = {
  uploadProductImages,
  uploadProductVideos,
  uploadProductMedia,
  uploadKycDocuments,
  useCloudinary
};
