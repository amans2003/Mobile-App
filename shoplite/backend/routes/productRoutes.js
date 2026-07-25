const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// @route   GET /api/products
router.get('/', getProducts);

// @route   GET /api/products/:id
router.get('/:id', getProductById);

// @route   POST /api/products (Admin only, with Cloudinary/50MB image upload)
router.post('/', protect, adminOnly, upload.single('image'), createProduct);

// @route   PUT /api/products/:id (Admin only, with Cloudinary/50MB image upload)
router.put('/:id', protect, adminOnly, upload.single('image'), updateProduct);

// @route   DELETE /api/products/:id (Admin only)
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
