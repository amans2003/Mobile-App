const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Generate JWT token
 * @param {string} id - User ID to encode in token
 * @returns {string} JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

/**
 * @desc    Register a new employee from mobile/public (requires HR/Admin approval)
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Generate employee ID
    const count = await User.countDocuments();
    const employeeId = `EMP${String(count + 1).padStart(4, '0')}`;

    // Create user with status 'pending_approval'
    const user = await User.create({
      name,
      email,
      password,
      phone: phone || '',
      employeeId,
      role: 'employee',
      status: 'pending_approval', // Must be approved by Admin / HR / Finance before logging in
    });

    // Return status without JWT token since login is blocked until approved
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      employeeId: user.employeeId,
      message: 'Registration successful! Your account has been sent to Admin and HR for approval before you can log in.',
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * @desc    Login user with approval validation
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if account is approved
    if (user.status === 'pending_approval') {
      return res.status(403).json({
        message: 'Your account is pending HR/Admin approval. You will be able to log in once an administrator approves your account.',
      });
    }

    // Check if terminated or resigned
    if (user.status === 'terminated' || user.status === 'resigned') {
      return res.status(403).json({
        message: 'Your employee account is inactive. Please reach out to HR.',
      });
    }

    // Return user data with token
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      department: user.department,
      designation: user.designation,
      employeeId: user.employeeId,
      phone: user.phone,
      avatar: user.avatar,
      leaveBalances: user.leaveBalances,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('reportingManager', 'name email designation');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error.message);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

module.exports = { register, login, getMe };
