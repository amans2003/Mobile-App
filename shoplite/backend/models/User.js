const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema — Enterprise HRIS
 * Stores employee information with RBAC roles, department hierarchy,
 * salary structure, and emergency contacts.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },

    // ── RBAC ──────────────────────────────────────────────────
    role: {
      type: String,
      enum: ['super_admin', 'hr_manager', 'finance_officer', 'department_manager', 'employee'],
      default: 'employee',
    },

    // ── Organisation ─────────────────────────────────────────
    department: {
      type: String,
      trim: true,
      default: '',
    },
    designation: {
      type: String,
      trim: true,
      default: '',
    },
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    reportingManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'pending_approval', 'on_leave', 'terminated', 'resigned'],
      default: 'active',
    },

    // ── Salary Structure ─────────────────────────────────────
    salary: {
      basic: { type: Number, default: 0 },
      hra: { type: Number, default: 0 },          // Housing Allowance
      transport: { type: Number, default: 0 },     // Transport Allowance
      medical: { type: Number, default: 0 },       // Medical Allowance
      special: { type: Number, default: 0 },       // Special Allowance
      deductions: {
        tax: { type: Number, default: 0 },
        insurance: { type: Number, default: 0 },
        providentFund: { type: Number, default: 0 },
      },
    },

    // ── Leave Balances ───────────────────────────────────────
    leaveBalances: {
      pto: { type: Number, default: 20 },          // Paid Time Off
      sick: { type: Number, default: 10 },
      casual: { type: Number, default: 7 },
    },

    // ── Emergency Contact ────────────────────────────────────
    emergencyContact: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      relation: { type: String, default: '' },
    },

    // ── Address ──────────────────────────────────────────────
    address: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Hash password before saving to database
 */
userSchema.pre('save', async function (next) {
  // Only hash if the password field has been modified
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Compare entered password with hashed password in database
 * @param {string} enteredPassword - Plain text password to compare
 * @returns {boolean} - True if passwords match
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Virtual: Compute gross salary from salary components
 */
userSchema.virtual('grossSalary').get(function () {
  const s = this.salary || {};
  return (s.basic || 0) + (s.hra || 0) + (s.transport || 0) + (s.medical || 0) + (s.special || 0);
});

/**
 * Virtual: Compute total deductions
 */
userSchema.virtual('totalDeductions').get(function () {
  const d = this.salary?.deductions || {};
  return (d.tax || 0) + (d.insurance || 0) + (d.providentFund || 0);
});

/**
 * Virtual: Net salary = gross - deductions
 */
userSchema.virtual('netSalary').get(function () {
  return this.grossSalary - this.totalDeductions;
});

// Include virtuals in JSON & object serialisation
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
