const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const {
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');

// @route   GET /api/announcements (all authenticated users)
router.get('/', protect, getAnnouncements);

// @route   POST /api/announcements (HR / Admin only)
router.post('/', protect, adminOnly, createAnnouncement);

// @route   PUT /api/announcements/:id (HR / Admin only)
router.put('/:id', protect, adminOnly, updateAnnouncement);

// @route   DELETE /api/announcements/:id (HR / Admin only)
router.delete('/:id', protect, adminOnly, deleteAnnouncement);

module.exports = router;
