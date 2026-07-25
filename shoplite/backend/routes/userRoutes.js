const express = require('express');
const router = express.Router();
const { getUsers, getUserCount } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// @route   GET /api/users/count (must be before /:id style routes)
router.get('/count', protect, adminOnly, getUserCount);

// @route   GET /api/users
router.get('/', protect, adminOnly, getUsers);

module.exports = router;
