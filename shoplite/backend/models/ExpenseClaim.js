const mongoose = require('mongoose');

/**
 * Expense Claim Schema — Enterprise HRIS
 * Employee-submitted reimbursement requests with receipt images
 * and administrative approval workflow.
 */
const expenseClaimSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    category: {
      type: String,
      enum: ['travel', 'meals', 'accommodation', 'software', 'equipment', 'office_supplies', 'training', 'other'],
      default: 'other',
    },
    receiptUrl: {
      type: String,
      default: '',
    },
    expenseDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'reimbursed'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewerNotes: {
      type: String,
      default: '',
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ExpenseClaim', expenseClaimSchema);
