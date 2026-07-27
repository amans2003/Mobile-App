/**
 * Payroll Calculator Utility — Pure Business Logic Module
 * Encapsulates salary calculations according to attendance rules,
 * daily rates, half-day 50% credits, unpaid leave deductions, and statutory deductions.
 */

/**
 * Validates attendance deduction value
 */
const validateDeductionAmount = (amount) => {
  const num = Number(amount);
  if (isNaN(num) || num < 0) {
    return { isValid: false, error: 'Attendance deduction cannot be negative.' };
  }
  return { isValid: true, amount: num };
};

/**
 * Computes monthly salary breakdown for an employee based on attendance records
 * 
 * Rules:
 * - Daily Salary = Gross Monthly Salary / Total Working Days
 * - Present (100%): +1.0 Daily Salary
 * - Paid Leave (100%): +1.0 Daily Salary (No deduction)
 * - Half Day (50%): +0.5 Daily Salary (50% deduction)
 * - Approved Unpaid Leave: -1.0 Daily Salary (or configured deduction)
 * - Absent: -1.0 Daily Salary
 */
const calculateEmployeePayroll = ({ salary, attendanceRecords, workingDays = 26, customDeductionAmount = 0 }) => {
  const sal = salary || {};
  const ded = sal.deductions || {};

  const baseGross = 
    (Number(sal.basic) || 0) + 
    (Number(sal.hra) || 0) + 
    (Number(sal.transport) || 0) + 
    (Number(sal.medical) || 0) + 
    (Number(sal.special) || 0);

  const perDayRate = workingDays > 0 ? baseGross / workingDays : 0;

  // Calculate attendance status counts & present credit
  let presentDays = 0;
  let halfDays = 0;
  let paidLeaveDays = 0;
  let unpaidLeaveDays = 0;
  let absentDays = 0;
  let totalOvertimeHours = 0;

  attendanceRecords.forEach((record) => {
    totalOvertimeHours += Number(record.overtime) || 0;
    const status = record.status;

    if (status === 'present' || status === 'late') {
      presentDays += 1.0;
    } else if (status === 'on_leave') {
      paidLeaveDays += 1.0;
      presentDays += 1.0; // Paid leave gets 100% full salary credit
    } else if (status === 'half_day') {
      halfDays += 1;
      presentDays += 0.5; // Half day gets 50% salary credit
    } else if (status === 'unpaid_leave') {
      unpaidLeaveDays += 1.0;
    } else if (status === 'absent') {
      absentDays += 1.0;
    }
  });

  // Calculate total unpaid / lost days
  const totalUnpaidDays = Math.max(0, workingDays - presentDays);
  
  // Calculate attendance deduction
  let attendanceDeduction = 0;
  if (customDeductionAmount > 0) {
    attendanceDeduction = (unpaidLeaveDays + absentDays + (halfDays * 0.5)) * customDeductionAmount;
  } else {
    attendanceDeduction = Math.round(totalUnpaidDays * perDayRate);
  }

  // Ensure attendance deduction is non-negative
  attendanceDeduction = Math.max(0, attendanceDeduction);

  // Overtime Pay calculation
  const overtimePay = Math.round(totalOvertimeHours * (perDayRate / 8));

  // Gross and Net Salary calculations with pro-rated statutory deductions based on days worked
  const grossSalary = baseGross + overtimePay;
  const fullStatutory = (Number(ded.tax) || 0) + (Number(ded.insurance) || 0) + (Number(ded.providentFund) || 0);
  const statutoryRatio = workingDays > 0 ? Math.min(1, presentDays / workingDays) : 1;
  const statutoryDeductions = Math.round(fullStatutory * statutoryRatio);

  const totalDeductions = statutoryDeductions + attendanceDeduction;
  const netSalary = Math.max(0, Math.round(grossSalary - totalDeductions));

  return {
    baseGross,
    workingDays,
    presentDays,
    halfDays,
    paidLeaveDays,
    unpaidLeaveDays,
    absentDays,
    totalUnpaidDays,
    perDayRate: Math.round(perDayRate * 100) / 100,
    overtimeHours: totalOvertimeHours,
    overtimePay,
    attendanceDeduction,
    statutoryDeductions,
    grossSalary,
    totalDeductions,
    netSalary,
  };
};

module.exports = {
  validateDeductionAmount,
  calculateEmployeePayroll,
};
