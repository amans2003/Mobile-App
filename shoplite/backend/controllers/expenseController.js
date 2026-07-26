const ExpenseClaim = require('../models/ExpenseClaim');

/**
 * @desc    Submit an expense claim
 * @route   POST /api/expenses
 * @access  Private (any employee)
 */
const submitExpense = async (req, res) => {
  try {
    const { title, description, amount, category, receiptUrl, expenseDate } = req.body;

    if (!title || !amount || !expenseDate) {
      return res.status(400).json({ message: 'Title, amount, and expense date are required' });
    }

    const expense = await ExpenseClaim.create({
      employee: req.user._id,
      title,
      description: description || '',
      amount,
      category: category || 'other',
      receiptUrl: receiptUrl || '',
      expenseDate: new Date(expenseDate),
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error('Submit expense error:', error.message);
    res.status(500).json({ message: 'Server error submitting expense' });
  }
};

/**
 * @desc    Get my expense claims
 * @route   GET /api/expenses/my
 * @access  Private
 */
const getMyExpenses = async (req, res) => {
  try {
    const expenses = await ExpenseClaim.find({ employee: req.user._id })
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(expenses);
  } catch (error) {
    console.error('Get my expenses error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get all expense claims (HR / Finance view)
 * @route   GET /api/expenses
 * @access  HR / Finance
 */
const getAllExpenses = async (req, res) => {
  try {
    const { status, employee, category } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (employee) filter.employee = employee;
    if (category) filter.category = category;

    const expenses = await ExpenseClaim.find(filter)
      .populate('employee', 'name email employeeId department')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(expenses);
  } catch (error) {
    console.error('Get all expenses error:', error.message);
    res.status(500).json({ message: 'Server error fetching expenses' });
  }
};

/**
 * @desc    Review an expense claim (approve/reject)
 * @route   PUT /api/expenses/:id/review
 * @access  HR / Finance
 */
const reviewExpense = async (req, res) => {
  try {
    const { status, reviewerNotes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }

    const expense = await ExpenseClaim.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense claim not found' });
    }

    expense.status = status;
    expense.reviewedBy = req.user._id;
    expense.reviewerNotes = reviewerNotes || '';
    expense.reviewedAt = new Date();

    await expense.save();

    const updated = await ExpenseClaim.findById(expense._id)
      .populate('employee', 'name email employeeId department')
      .populate('reviewedBy', 'name');

    res.json(updated);
  } catch (error) {
    console.error('Review expense error:', error.message);
    res.status(500).json({ message: 'Server error reviewing expense' });
  }
};

const fs = require('fs');
const path = require('path');
const { uploadToCloudinary } = require('../config/cloudinary');

/**
 * @desc    Upload an expense receipt document / image to Cloudinary
 * @route   POST /api/expenses/upload
 * @access  Private
 */
const uploadReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided for upload' });
    }

    const localPath = path.join(__dirname, '..', req.file.path);
    const host = req.get('host') || 'localhost:5001';
    const fallbackUrl = `http://${host}/uploads/${req.file.filename}`;

    // Upload to Cloudinary
    const cloudResult = await uploadToCloudinary(localPath);
    let finalUrl = fallbackUrl;

    if (cloudResult.success && cloudResult.url) {
      finalUrl = cloudResult.url;
      // Clean up staging local file after successful cloud transmission
      if (fs.existsSync(localPath)) {
        try { fs.unlinkSync(localPath); } catch (e) {}
      }
    }

    res.status(200).json({
      url: finalUrl,
      filename: req.file.originalname,
      message: cloudResult.success ? 'Successfully uploaded to Cloudinary' : 'Saved to server disk',
    });
  } catch (error) {
    console.error('Upload receipt error:', error.message);
    res.status(500).json({ message: 'Server error uploading file to Cloudinary' });
  }
};

/**
 * @desc    Admin / HR directly uploads & assigns a Cloudinary document to an expense claim
 * @route   PUT /api/expenses/:id/upload
 * @access  HR / Admin
 */
const attachAdminDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No document selected to attach' });
    }

    const expense = await ExpenseClaim.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense claim not found' });
    }

    const localPath = path.join(__dirname, '..', req.file.path);
    const host = req.get('host') || 'localhost:5001';
    const fallbackUrl = `http://${host}/uploads/${req.file.filename}`;

    const cloudResult = await uploadToCloudinary(localPath);
    let finalUrl = fallbackUrl;

    if (cloudResult.success && cloudResult.url) {
      finalUrl = cloudResult.url;
      if (fs.existsSync(localPath)) {
        try { fs.unlinkSync(localPath); } catch (e) {}
      }
    }

    expense.receiptUrl = finalUrl;
    await expense.save();

    const updated = await ExpenseClaim.findById(expense._id)
      .populate('employee', 'name email employeeId department')
      .populate('reviewedBy', 'name');

    res.status(200).json({ updated, url: finalUrl, message: 'Cloudinary document attached by Admin/HR' });
  } catch (error) {
    console.error('Attach admin document error:', error.message);
    res.status(500).json({ message: 'Server error attaching document' });
  }
};

module.exports = {
  submitExpense,
  getMyExpenses,
  getAllExpenses,
  reviewExpense,
  uploadReceipt,
  attachAdminDocument,
};
