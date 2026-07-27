const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const {
  createMeeting,
  updateMeeting,
  getMyMeetings,
  getAllMeetings,
  rsvpMeeting,
  cancelMeeting,
} = require('../controllers/meetingController');

// ── Employee Self-Service ────────────────────────────────────
// @route   POST /api/meetings
router.post('/', protect, createMeeting);

// @route   PUT /api/meetings/:id
router.put('/:id', protect, updateMeeting);

// @route   GET /api/meetings/my
router.get('/my', protect, getMyMeetings);

// @route   PUT /api/meetings/:id/rsvp
router.put('/:id/rsvp', protect, rsvpMeeting);

// @route   PUT /api/meetings/:id/cancel
router.put('/:id/cancel', protect, cancelMeeting);

// ── HR / Admin View ──────────────────────────────────────────
// @route   GET /api/meetings
router.get('/', protect, adminOnly, getAllMeetings);

module.exports = router;
