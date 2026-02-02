const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const config = require('./env');

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret
});

// Storage for product images
const productImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'lbr-fruits/products/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit', quality: 'auto' }],
    resource_type: 'image'
  }
});

// Storage for product videos
const productVideoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'lbr-fruits/products/videos',
    allowed_formats: ['mp4', 'webm', 'mov', 'avi'],
    resource_type: 'video'
  }
});

// Storage for KYC documents
const kycDocumentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'lbr-fruits/kyc',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: 'auto'
  }
});

// Storage for product media (images + videos)
const productMediaStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith('video/');
    return {
      folder: isVideo ? 'lbr-fruits/products/videos' : 'lbr-fruits/products/images',
      resource_type: isVideo ? 'video' : 'image',
      allowed_formats: isVideo 
        ? ['mp4', 'webm', 'mov', 'avi'] 
        : ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: isVideo ? [] : [{ width: 1000, height: 1000, crop: 'limit', quality: 'auto' }]
    };
  }
});

// Delete file from Cloudinary
const deleteFile = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return result;
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    throw error;
  }
};

// Extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  // URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/v{version}/{public_id}.{format}
  const matches = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
  return matches ? matches[1] : null;
};

module.exports = {
  cloudinary,
  productImageStorage,
  productVideoStorage,
  kycDocumentStorage,
  productMediaStorage,
  deleteFile,
  getPublicIdFromUrl
};
