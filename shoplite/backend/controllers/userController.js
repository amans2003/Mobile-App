const User = require('../models/User');

/**
 * @desc    Get all users (exclude passwords)
 * @route   GET /api/users
 * @access  Admin
 */
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error.message);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

/**
 * @desc    Get total user count
 * @route   GET /api/users/count
 * @access  Admin
 */
const getUserCount = async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Get user count error:', error.message);
    res.status(500).json({ message: 'Server error fetching user count' });
  }
};

module.exports = { getUsers, getUserCount };
