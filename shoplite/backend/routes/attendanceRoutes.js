const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const {
  checkIn,
  checkOut,
  getAttendanceRules,
  updateAttendanceRules,
  updateAttendanceStatus,
  getMyToday,
  getMyHistory,
  getAttendanceLogs,
  getAttendanceStats,
} = require('../controllers/attendanceController');

// ── Employee Self-Service & Timing Rules ─────────────────────
// @route   GET /api/attendance/rules (View office hours & half-day thresholds)
router.get('/rules', protect, getAttendanceRules);

// @route   POST /api/attendance/check-in
router.post('/check-in', protect, checkIn);

// @route   POST /api/attendance/check-out
router.post('/check-out', protect, checkOut);

// @route   GET /api/attendance/today
router.get('/today', protect, getMyToday);

// @route   GET /api/attendance/my-history
router.get('/my-history', protect, getMyHistory);

// ── HR / Admin Governance & Override Views ───────────────────
// @route   PUT /api/attendance/rules (Custom office timing & cutoff management)
router.put('/rules', protect, adminOnly, updateAttendanceRules);

// @route   PUT /api/attendance/:id/status (HR manual status edit & reason assignment)
router.put('/:id/status', protect, adminOnly, updateAttendanceStatus);

// @route   GET /api/attendance/stats
router.get('/stats', protect, adminOnly, getAttendanceStats);

// @route   GET /api/attendance/logs
router.get('/logs', protect, adminOnly, getAttendanceLogs);

module.exports = router;
