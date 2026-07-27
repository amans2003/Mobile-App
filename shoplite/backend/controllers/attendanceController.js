const Attendance = require('../models/Attendance');
const AttendanceRule = require('../models/AttendanceRule');
const {
  parseTimeToDecimal,
  formatDecimalToHoursMinutes,
  calculateWorkingHours,
  calculateHalfDayWorkingHours,
  validateShiftSettings,
  evaluateAttendance,
} = require('../utils/attendanceCalculator');

/**
 * Get today's date string in YYYY-MM-DD format
 */
const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * @desc    Employee check-in with Automatic Half-Day Rule Evaluation (10:30 AM / 2:00 PM)
 * @route   POST /api/attendance/check-in
 * @access  Private (any employee)
 */
const checkIn = async (req, res) => {
  try {
    const { latitude, longitude, selfieUrl } = req.body;
    const today = getTodayString();

    // Check if already checked in today
    let record = await Attendance.findOne({ employee: req.user._id, date: today });

    if (record && record.checkIn.time) {
      return res.status(400).json({ message: 'You have already checked in today' });
    }

    const now = new Date();

    // Fetch customized office timing rules
    let rule = await AttendanceRule.findOne({ ruleId: 'default' });
    if (!rule) {
      rule = await AttendanceRule.create({ ruleId: 'default' });
    }

    const evalResult = evaluateAttendance({
      checkInDate: now,
      checkOutDate: null,
      rule,
    });

    if (!record) {
      record = new Attendance({
        employee: req.user._id,
        date: today,
        checkIn: {
          time: now,
          location: { latitude: latitude || null, longitude: longitude || null },
          selfieUrl: selfieUrl || '',
        },
        status: evalResult.status,
        notes: evalResult.notes,
      });
    } else {
      record.checkIn = {
        time: now,
        location: { latitude: latitude || null, longitude: longitude || null },
        selfieUrl: selfieUrl || '',
      };
      if (!record.isManuallyEdited) {
        record.status = evalResult.status;
        record.notes = evalResult.notes;
      }
    }

    await record.save();
    res.status(201).json(record);
  } catch (error) {
    console.error('Check-in error:', error.message);
    res.status(500).json({ message: 'Server error during check-in' });
  }
};

/**
 * @desc    Employee check-out
 * @route   POST /api/attendance/check-out
 * @access  Private (any employee)
 */
const checkOut = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const today = getTodayString();

    const record = await Attendance.findOne({ employee: req.user._id, date: today });

    if (!record || !record.checkIn.time) {
      return res.status(400).json({ message: 'You have not checked in today' });
    }

    if (record.checkOut.time) {
      return res.status(400).json({ message: 'You have already checked out today' });
    }

    const now = new Date();
    record.checkOut = {
      time: now,
      location: { latitude: latitude || null, longitude: longitude || null },
    };

    // Calculate work hours
    const diffMs = now - new Date(record.checkIn.time);
    const diffHours = Math.max(0, Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100);
    record.workHours = diffHours;

    // Calculate overtime (anything beyond 8 hours)
    if (diffHours > 8) {
      record.overtime = Math.round((diffHours - 8) * 100) / 100;
    }

    // Fetch rule for shift & half-day hours evaluation
    let rule = await AttendanceRule.findOne({ ruleId: 'default' });
    if (!rule) {
      rule = await AttendanceRule.create({ ruleId: 'default' });
    }

    const evalResult = evaluateAttendance({
      checkInDate: record.checkIn.time,
      checkOutDate: now,
      rule,
    });

    // Status evaluation upon check-out based on completed work hours & rules
    if (!record.isManuallyEdited && !record.notes?.includes('Approved Half-Day')) {
      record.status = evalResult.status;
      record.notes = evalResult.notes;
    }

    await record.save();
    res.json(record);
  } catch (error) {
    console.error('Check-out error:', error.message);
    res.status(500).json({ message: 'Server error during check-out' });
  }
};

/**
 * @desc    Get custom office timings & half-day rules
 * @route   GET /api/attendance/rules
 * @access  Private
 */
const getAttendanceRules = async (req, res) => {
  try {
    let rule = await AttendanceRule.findOne({ ruleId: 'default' });
    if (!rule) {
      rule = await AttendanceRule.create({ ruleId: 'default' });
    }
    res.json(rule);
  } catch (error) {
    console.error('Get attendance rules error:', error.message);
    res.status(500).json({ message: 'Server error fetching attendance rules' });
  }
};

/**
 * @desc    Update custom office timings & half-day rules (Admin / HR)
 * @route   PUT /api/attendance/rules
 * @access  HR / Admin
 */
const updateAttendanceRules = async (req, res) => {
  try {
    const {
      officeStartTime,
      halfDayThreshold,
      afternoonThreshold,
      officeEndTime,
      halfDayWorkingHours,
      customDeductionAmount,
      workingDaysPerMonth,
      autoCalculateHalfDay,
    } = req.body;

    // Rule 10 & Rule 14 Validations
    if (customDeductionAmount !== undefined && customDeductionAmount !== null) {
      if (Number(customDeductionAmount) < 0) {
        return res.status(400).json({ message: 'Attendance deduction cannot be negative.' });
      }
    }

    const validation = validateShiftSettings({
      officeStartTime: officeStartTime || '09:00',
      officeEndTime: officeEndTime || '18:00',
      halfDayThreshold: halfDayThreshold || '13:00',
      halfDayWorkingHours: halfDayWorkingHours !== undefined ? Number(halfDayWorkingHours) : undefined,
      customDeductionAmount: customDeductionAmount !== undefined ? Number(customDeductionAmount) : undefined,
    });

    if (!validation.isValid) {
      return res.status(400).json({ message: validation.errors[0] || 'Invalid shift parameters' });
    }

    let rule = await AttendanceRule.findOne({ ruleId: 'default' });
    if (!rule) {
      rule = new AttendanceRule({ ruleId: 'default' });
    }

    if (officeStartTime !== undefined) rule.officeStartTime = officeStartTime;
    if (halfDayThreshold !== undefined) rule.halfDayThreshold = halfDayThreshold;
    if (afternoonThreshold !== undefined) rule.afternoonThreshold = afternoonThreshold;
    if (officeEndTime !== undefined) rule.officeEndTime = officeEndTime;
    if (halfDayWorkingHours !== undefined) rule.halfDayWorkingHours = Number(halfDayWorkingHours);
    if (customDeductionAmount !== undefined) rule.customDeductionAmount = Number(customDeductionAmount);
    if (workingDaysPerMonth !== undefined) rule.workingDaysPerMonth = Number(workingDaysPerMonth);
    if (autoCalculateHalfDay !== undefined) rule.autoCalculateHalfDay = Boolean(autoCalculateHalfDay);
    rule.updatedBy = req.user._id;

    await rule.save();
    res.json({ message: 'Custom shift settings and half-day rules updated successfully!', rule });
  } catch (error) {
    console.error('Update attendance rules error:', error.message);
    res.status(500).json({ message: 'Server error updating attendance rules' });
  }
};

/**
 * @desc    HR Manually edit an attendance record status & assign a reason (e.g. employee left after 2 PM)
 * @route   PUT /api/attendance/:id/status
 * @access  HR / Admin
 */
const updateAttendanceStatus = async (req, res) => {
  try {
    const { status, manualReason, overrideNotes, notes } = req.body;

    if (!['present', 'absent', 'half_day', 'late', 'on_leave', 'unpaid_leave', 'holiday', 'weekend'].includes(status)) {
      return res.status(400).json({ message: 'Invalid attendance status selected' });
    }

    const record = await Attendance.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    const reasonText = overrideNotes || notes || manualReason || 'Manually edited by HR Manager';

    record.status = status;
    record.manualReason = reasonText;
    record.notes = reasonText;
    record.isManuallyEdited = true;

    await record.save();

    const updated = await Attendance.findById(record._id)
      .populate('employee', 'name email employeeId department designation avatar');

    res.json({ message: 'Attendance status and reason manually adjusted by HR!', updated });
  } catch (error) {
    console.error('Update attendance status error:', error.message);
    res.status(500).json({ message: 'Server error updating attendance record' });
  }
};

/**
 * @desc    Get today's attendance status for current user
 * @route   GET /api/attendance/today
 * @access  Private
 */
const getMyToday = async (req, res) => {
  try {
    const today = getTodayString();
    const record = await Attendance.findOne({ employee: req.user._id, date: today });
    res.json(record || { status: 'not_checked_in', date: today });
  } catch (error) {
    console.error('Get today attendance error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get attendance history for current user
 * @route   GET /api/attendance/my-history
 * @access  Private
 */
const getMyHistory = async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = { employee: req.user._id };

    if (month && year) {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const records = await Attendance.find(filter).sort({ date: -1 }).limit(60);
    res.json(records);
  } catch (error) {
    console.error('Get my history error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get all attendance logs (HR view)
 * @route   GET /api/attendance/logs
 * @access  HR / Admin
 */
const getAttendanceLogs = async (req, res) => {
  try {
    const { date, employee, status } = req.query;
    const filter = {};

    if (date) filter.date = date;
    if (employee) filter.employee = employee;
    if (status) filter.status = status;

    // Default to today's records if no filter specified
    if (!date && !employee && !status) {
      filter.date = getTodayString();
    }

    // Auto-correct any unedited records where full work hours (>= 4.5 hrs) were completed but status remained half_day
    await Attendance.updateMany(
      {
        workHours: { $gte: 4.5 },
        status: 'half_day',
        isManuallyEdited: { $ne: true },
        notes: { $not: /Approved Half-Day/i },
      },
      {
        $set: {
          status: 'present',
          notes: 'Full Day Work Completed',
        },
      }
    );

    const logs = await Attendance.find(filter)
      .populate('employee', 'name email employeeId department designation avatar')
      .sort({ date: -1, 'checkIn.time': -1 });

    res.json(logs);
  } catch (error) {
    console.error('Get attendance logs error:', error.message);
    res.status(500).json({ message: 'Server error fetching attendance logs' });
  }
};

/**
 * @desc    Get attendance statistics
 * @route   GET /api/attendance/stats
 * @access  HR / Admin
 */
const getAttendanceStats = async (req, res) => {
  try {
    const today = getTodayString();

    const todayPresent = await Attendance.countDocuments({ date: today, status: { $in: ['present', 'late'] } });
    const todayHalfDay = await Attendance.countDocuments({ date: today, status: 'half_day' });
    const todayLate = await Attendance.countDocuments({ date: today, status: 'late' });
    const todayAbsent = await Attendance.countDocuments({ date: today, status: 'absent' });
    const todayOnLeave = await Attendance.countDocuments({ date: today, status: 'on_leave' });

    res.json({
      date: today,
      present: todayPresent,
      halfDay: todayHalfDay,
      late: todayLate,
      absent: todayAbsent,
      onLeave: todayOnLeave,
    });
  } catch (error) {
    console.error('Get attendance stats error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getAttendanceRules,
  updateAttendanceRules,
  updateAttendanceStatus,
  getMyToday,
  getMyHistory,
  getAttendanceLogs,
  getAttendanceStats,
};
