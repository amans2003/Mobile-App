const mongoose = require('mongoose');

/**
 * Payroll Schema — Enterprise HRIS
 * Monthly salary records with line-item breakdown, net calculation,
 * and optional PDF payslip URL.
 */
const payrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    month: {
      type: Number, // 1-12
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },

    // ── Earnings ─────────────────────────────────────────────
    basic: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    medical: { type: Number, default: 0 },
    special: { type: Number, default: 0 },
    overtime: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    reimbursements: { type: Number, default: 0 },

    // ── Deductions ───────────────────────────────────────────
    tax: { type: Number, default: 0 },
    insurance: { type: Number, default: 0 },
    providentFund: { type: Number, default: 0 },
    unpaidLeaveDays: { type: Number, default: 0 },
    unpaidLeaveDeduction: { type: Number, default: 0 },

    // ── Totals ───────────────────────────────────────────────
    grossSalary: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 },

    // ── Metadata ─────────────────────────────────────────────
    status: {
      type: String,
      enum: ['draft', 'processed', 'paid'],
      default: 'draft',
    },
    pdfUrl: {
      type: String,
      default: '',
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    workingDays: { type: Number, default: 0 },
    presentDays: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// One payroll record per employee per month
payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);
