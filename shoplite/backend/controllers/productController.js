const Product = require('../models/Product');
const { uploadToCloudinary } = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

/**
 * Helper to handle uploaded image storage resilience:
 * Attempt uploading to Cloudinary cloud; if successful, clean up temp staging file and use cloud URL.
 * If Cloudinary encounters an API error (like 403), gracefully fall back to local /uploads URL without blocking user!
 */
const processUploadedImage = async (file) => {
  if (!file) return null;

  const localPath = path.join(__dirname, '..', file.path);
  const localUrl = `/uploads/${file.filename}`;

  // Try Cloudinary upload
  const cloudResult = await uploadToCloudinary(localPath);
  if (cloudResult.success && cloudResult.url) {
    // Successfully stored in Cloudinary; remove staging local file
    if (fs.existsSync(localPath)) {
      try {
        fs.unlinkSync(localPath);
      } catch (e) {
        console.warn('Could not remove staging file:', e.message);
      }
    }
    return cloudResult.url;
  }

  // Fall back cleanly to local disk storage if Cloudinary returns 403 or API failure
  console.warn(`⚠️ Cloudinary upload attempt unsuccessful (${cloudResult.reason}). Image saved safely to local disk (${localUrl}).`);
  return localUrl;
};

/**
 * @desc    Get all products
 * @route   GET /api/products
 * @access  Public
 */
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error.message);
    res.status(500).json({ message: 'Server error fetching products' });
  }
};

/**
 * @desc    Get single product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error.message);

    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(500).json({ message: 'Server error fetching product' });
  }
};

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Admin
 */
const createProduct = async (req, res) => {
  try {
    const { title, description, price, category, stock } = req.body;

    if (!title || !description || !price || !category) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const productData = {
      title,
      description,
      price: Number(price),
      category,
      stock: Number(stock) || 0,
    };

    if (req.file) {
      productData.image = await processUploadedImage(req.file);
    }

    const product = await Product.create(productData);
    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error.message);
    res.status(500).json({ message: 'Server error creating product' });
  }
};

/**
 * @desc    Update a product
 * @route   PUT /api/products/:id
 * @access  Admin
 */
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { title, description, price, category, stock } = req.body;

    product.title = title || product.title;
    product.description = description || product.description;
    product.price = price !== undefined ? Number(price) : product.price;
    product.category = category || product.category;
    product.stock = stock !== undefined ? Number(stock) : product.stock;

    if (req.file) {
      // Delete old local file if it existed
      if (product.image && !product.image.startsWith('http')) {
        const oldPath = path.join(__dirname, '..', product.image);
        if (fs.existsSync(oldPath)) {
          try {
            fs.unlinkSync(oldPath);
          } catch (e) {}
        }
      }
      product.image = await processUploadedImage(req.file);
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    console.error('Update product error:', error.message);

    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(500).json({ message: 'Server error updating product' });
  }
};

/**
 * @desc    Delete a product
 * @route   DELETE /api/products/:id
 * @access  Admin
 */
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.image && !product.image.startsWith('http')) {
      const imagePath = path.join(__dirname, '..', product.image);
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (e) {}
      }
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error.message);

    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(500).json({ message: 'Server error deleting product' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
