const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { adminOnly, managerOnly } = require('../middleware/adminMiddleware');
const {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  reviewLeave,
  cancelLeave,
} = require('../controllers/leaveController');

// ── Employee Self-Service ────────────────────────────────────
// @route   POST /api/leaves
router.post('/', protect, applyLeave);

// @route   GET /api/leaves/my
router.get('/my', protect, getMyLeaves);

// @route   PUT /api/leaves/:id/cancel
router.put('/:id/cancel', protect, cancelLeave);

// ── HR / Manager Views ──────────────────────────────────────
// @route   GET /api/leaves
router.get('/', protect, managerOnly, getAllLeaves);

// @route   PUT /api/leaves/:id/review
router.put('/:id/review', protect, managerOnly, reviewLeave);

module.exports = router;
