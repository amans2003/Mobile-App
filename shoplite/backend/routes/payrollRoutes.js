const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { financeOnly } = require('../middleware/adminMiddleware');
const {
  generatePayroll,
  getPayrollRecords,
  getMySalary,
  getPayrollStats,
} = require('../controllers/payrollController');

// ── Employee Self-Service ────────────────────────────────────
// @route   GET /api/payroll/my
router.get('/my', protect, getMySalary);

// ── HR / Finance ─────────────────────────────────────────────
// @route   GET /api/payroll/stats
router.get('/stats', protect, financeOnly, getPayrollStats);

// @route   POST /api/payroll/generate
router.post('/generate', protect, financeOnly, generatePayroll);

// @route   GET /api/payroll
router.get('/', protect, financeOnly, getPayrollRecords);

module.exports = router;
