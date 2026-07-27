const Payroll = require('../models/Payroll');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const AttendanceRule = require('../models/AttendanceRule');
const { calculateEmployeePayroll, validateDeductionAmount } = require('../utils/payrollCalculator');

/**
 * @desc    Generate/process payroll for a specific month
 * @route   POST /api/payroll/generate
 * @access  HR / Finance
 */
const generatePayroll = async (req, res) => {
  try {
    const { month, year, workingDays: customWorkingDays } = req.body;

    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    // Fetch configured attendance timings and working days rule
    let rule = await AttendanceRule.findOne({ ruleId: 'default' });
    if (!rule) {
      rule = await AttendanceRule.create({ ruleId: 'default' });
    }

    const workingDays = customWorkingDays && Number(customWorkingDays) > 0
      ? Number(customWorkingDays)
      : (rule.workingDaysPerMonth || 26);

    if (customWorkingDays && Number(customWorkingDays) > 0) {
      rule.workingDaysPerMonth = Number(customWorkingDays);
      await rule.save();
    }

    // Get all active employees
    const employees = await User.find({ status: 'active' });
    const results = [];

    for (const emp of employees) {
      const sal = emp.salary || {};
      const ded = sal.deductions || {};

      // Fetch all monthly attendance records (present, late, half_day, on_leave, unpaid_leave, absent)
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

      const attendanceRecords = await Attendance.find({
        employee: emp._id,
        date: { $gte: startDate, $lte: endDate },
      });

      // Calculate payroll breakdown using payrollCalculator utility
      const calc = calculateEmployeePayroll({
        salary: sal,
        attendanceRecords,
        workingDays,
        customDeductionAmount: rule?.customDeductionAmount || 0,
      });

      const payrollData = {
        employee: emp._id,
        month,
        year,
        basic: sal.basic || 0,
        hra: sal.hra || 0,
        transport: sal.transport || 0,
        medical: sal.medical || 0,
        special: sal.special || 0,
        overtime: calc.overtimePay,
        tax: ded.tax || 0,
        insurance: ded.insurance || 0,
        providentFund: ded.providentFund || 0,
        unpaidLeaveDays: calc.totalUnpaidDays,
        unpaidLeaveDeduction: calc.attendanceDeduction,
        grossSalary: calc.grossSalary,
        totalDeductions: calc.totalDeductions,
        netSalary: calc.netSalary,
        status: 'processed',
        processedBy: req.user._id,
        workingDays: calc.workingDays,
        presentDays: calc.presentDays,
      };

      const payroll = await Payroll.findOneAndUpdate(
        { employee: emp._id, month, year },
        payrollData,
        { new: true, upsert: true }
      );

      results.push({ employee: emp.name, status: 'generated', payroll });
    }

    res.status(201).json({ message: `Payroll generated for ${results.length} employees`, results });
  } catch (error) {
    console.error('Generate payroll error:', error.message);
    res.status(500).json({ message: 'Server error generating payroll' });
  }
};

/**
 * @desc    Get payroll records (HR view)
 * @route   GET /api/payroll
 * @access  HR / Finance
 */
const getPayrollRecords = async (req, res) => {
  try {
    const { month, year, employee, status } = req.query;
    const filter = {};

    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    if (employee) filter.employee = employee;
    if (status) filter.status = status;

    const records = await Payroll.find(filter)
      .populate('employee', 'name email employeeId department designation')
      .populate('processedBy', 'name')
      .sort({ year: -1, month: -1 });

    res.json(records);
  } catch (error) {
    console.error('Get payroll error:', error.message);
    res.status(500).json({ message: 'Server error fetching payroll' });
  }
};

/**
 * @desc    Get my salary slips
 * @route   GET /api/payroll/my
 * @access  Private
 */
const getMySalary = async (req, res) => {
  try {
    const records = await Payroll.find({ employee: req.user._id })
      .sort({ year: -1, month: -1 });

    res.json(records);
  } catch (error) {
    console.error('Get my salary error:', error.message);
    res.status(500).json({ message: 'Server error fetching salary records' });
  }
};

/**
 * @desc    Get payroll summary stats
 * @route   GET /api/payroll/stats
 * @access  HR / Finance
 */
const getPayrollStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    const records = await Payroll.find({ month: parseInt(currentMonth), year: parseInt(currentYear) });

    const totalGross = records.reduce((sum, r) => sum + r.grossSalary, 0);
    const totalNet = records.reduce((sum, r) => sum + r.netSalary, 0);
    const totalDeductions = records.reduce((sum, r) => sum + r.totalDeductions, 0);
    const employeesProcessed = records.length;

    res.json({
      month: currentMonth,
      year: currentYear,
      employeesProcessed,
      totalGross,
      totalNet,
      totalDeductions,
    });
  } catch (error) {
    console.error('Get payroll stats error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  generatePayroll,
  getPayrollRecords,
  getMySalary,
  getPayrollStats,
};
