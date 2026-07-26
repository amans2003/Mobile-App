const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { financeOnly } = require('../middleware/adminMiddleware');
const { upload } = require('../config/cloudinary');
const {
  submitExpense,
  getMyExpenses,
  getAllExpenses,
  reviewExpense,
  uploadReceipt,
  attachAdminDocument,
} = require('../controllers/expenseController');

// ── Employee Self-Service & Uploads ──────────────────────────
// @route   POST /api/expenses/upload (Cloudinary document / photo uploader)
router.post('/upload', protect, upload.single('receipt'), uploadReceipt);

// @route   POST /api/expenses
router.post('/', protect, submitExpense);

// @route   GET /api/expenses/my
router.get('/my', protect, getMyExpenses);

// ── HR / Admin Management ────────────────────────────────────
// @route   GET /api/expenses
router.get('/', protect, financeOnly, getAllExpenses);

// @route   PUT /api/expenses/:id/review
router.put('/:id/review', protect, financeOnly, reviewExpense);

// @route   PUT /api/expenses/:id/upload (Admin/HR direct Cloudinary document attach)
router.put('/:id/upload', protect, financeOnly, upload.single('receipt'), attachAdminDocument);

module.exports = router;
