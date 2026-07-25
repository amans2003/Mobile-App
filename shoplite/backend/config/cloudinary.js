const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Trim whitespace from credentials to prevent 403 authentication errors
const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

const isCloudinaryConfigured =
  cloudName &&
  cloudName !== 'your_cloud_name' &&
  apiKey &&
  apiSecret;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  console.log(`☁️  Cloudinary configured for cloud name: "${cloudName}".`);
} else {
  console.log('📂  Cloudinary keys not active in .env. Defaulting to local disk storage (/uploads).');
}

// Ensure local uploads directory always exists as staging / backup
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer disk storage config (staging before cloud upload, or direct backup)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter - allow common image formats
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname || mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

/**
 * Multer middleware with a generous 50MB file limit
 */
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

/**
 * Robust Cloudinary Uploader Helper
 * Uploads a local file to Cloudinary directly without troublesome Transformation flags that cause 403 errors.
 * Returns success status and secure URL, or graceful fallback details on API error.
 */
const uploadToCloudinary = async (localPath) => {
  if (!isCloudinaryConfigured) {
    return { success: false, reason: 'Cloudinary not configured' };
  }

  try {
    const result = await cloudinary.uploader.upload(localPath, {
      folder: 'shoplite_products',
      resource_type: 'auto',
    });
    return { success: true, url: result.secure_url };
  } catch (error) {
    console.error('❌ Cloudinary Upload API Error Details:', error.message || error);
    return { success: false, reason: error.message || 'API 403 Error' };
  }
};

module.exports = { cloudinary, upload, uploadToCloudinary, isCloudinaryConfigured };
