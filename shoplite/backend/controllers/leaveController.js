const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

/**
 * @desc    Apply for leave
 * @route   POST /api/leaves
 * @access  Private (any employee)
 */
const applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Calculate total days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (totalDays <= 0) {
      return res.status(400).json({ message: 'Invalid date range' });
    }

    // If employee has no leave balance left, they can still apply (especially after check-in for early exit / emergency).
    // HR will review and decide whether to approve as Half-Day (50% salary deduct) or Unpaid Full Day (100% salary deduct).

    const leave = await LeaveRequest.create({
      employee: req.user._id,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason,
    });

    res.status(201).json(leave);
  } catch (error) {
    console.error('Apply leave error:', error.message);
    res.status(500).json({ message: 'Server error applying for leave' });
  }
};

/**
 * @desc    Get my leave requests
 * @route   GET /api/leaves/my
 * @access  Private
 */
const getMyLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ employee: req.user._id })
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    console.error('Get my leaves error:', error.message);
    res.status(500).json({ message: 'Server error fetching leaves' });
  }
};

/**
 * @desc    Get all leave requests (HR view)
 * @route   GET /api/leaves
 * @access  HR / Admin / Manager
 */
const getAllLeaves = async (req, res) => {
  try {
    const { status, employee } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (employee) filter.employee = employee;

    const leaves = await LeaveRequest.find(filter)
      .populate('employee', 'name email employeeId department designation avatar')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    console.error('Get all leaves error:', error.message);
    res.status(500).json({ message: 'Server error fetching leaves' });
  }
};

/**
 * @desc    Approve or reject a leave request
 * @route   PUT /api/leaves/:id/review
 * @access  HR / Admin / Manager
 */
const reviewLeave = async (req, res) => {
  try {
    const { status, reviewerNotes, approvalType } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }

    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ message: 'This leave request has already been reviewed' });
    }

    leave.status = status;
    leave.reviewedBy = req.user._id;
    leave.reviewerNotes = reviewerNotes || '';
    leave.reviewedAt = new Date();
    if (status === 'approved') {
      leave.approvalType = approvalType || 'full_day';
    }

    // If approved, handle Half-Day (Automatic Check-Out) vs Full-Day logic
    if (status === 'approved') {
      if (approvalType === 'half_day') {
        leave.approvalType = 'half_day';
        const user = await User.findById(leave.employee);
        const paidLeaveTypes = ['pto', 'sick', 'casual'];
        let hadBalance = false;
        if (paidLeaveTypes.includes(leave.leaveType) && user && (user.leaveBalances[leave.leaveType] || 0) >= 0.5) {
          user.leaveBalances[leave.leaveType] = Math.max(0, (user.leaveBalances[leave.leaveType] || 0) - 0.5);
          await user.save();
          hadBalance = true;
        }

        let currDate = new Date(leave.startDate);
        const endDt = new Date(leave.endDate);
        while (currDate <= endDt) {
          const dateStr = currDate.toISOString().split('T')[0];
          const existingAtt = await Attendance.findOne({ employee: leave.employee, date: dateStr });
          const checkInTime = existingAtt && existingAtt.checkIn ? existingAtt.checkIn : new Date(dateStr + 'T10:00:00.000Z');
          const checkOutTime = existingAtt && existingAtt.checkOut ? existingAtt.checkOut : new Date();

          await Attendance.findOneAndUpdate(
            { employee: leave.employee, date: dateStr },
            {
              employee: leave.employee,
              date: dateStr,
              checkIn: checkInTime,
              checkOut: checkOutTime, // Automatic check-out applied upon HR Half-Day approval!
              status: 'half_day',
              workHours: 4,
              notes: hadBalance
                ? `Automatic Half-Day Check-Out by HR. 0.5 ${leave.leaveType.toUpperCase()} deducted from quota.`
                : `Automatic Half-Day Check-Out by HR (0 Leave Quota Left). 50% salary deducted for half day.`,
            },
            { new: true, upsert: true }
          );
          currDate.setDate(currDate.getDate() + 1);
        }
      } else {
        leave.approvalType = 'full_day';
        const user = await User.findById(leave.employee);
        const paidLeaveTypes = ['pto', 'sick', 'casual'];
        let hasEnoughBalance = false;

        if (paidLeaveTypes.includes(leave.leaveType) && user) {
          const currentBal = user.leaveBalances[leave.leaveType] || 0;
          if (currentBal > 0) {
            hasEnoughBalance = true;
            user.leaveBalances[leave.leaveType] = Math.max(0, currentBal - leave.totalDays);
            await user.save();
          }
        }

        let currDate = new Date(leave.startDate);
        const endDt = new Date(leave.endDate);
        while (currDate <= endDt) {
          const dateStr = currDate.toISOString().split('T')[0];
          const attStatus = hasEnoughBalance ? 'on_leave' : 'absent';
          const attNotes = hasEnoughBalance
            ? `Approved Paid Leave (${leave.leaveType.toUpperCase()}) - Zero Salary Deduction`
            : `Approved Leave without quota (0 Balance Left) - 100% Salary Deducted for absent day`;

          await Attendance.findOneAndUpdate(
            { employee: leave.employee, date: dateStr },
            {
              employee: leave.employee,
              date: dateStr,
              status: attStatus,
              notes: attNotes,
              workHours: hasEnoughBalance ? 8 : 0,
            },
            { new: true, upsert: true }
          );
          currDate.setDate(currDate.getDate() + 1);
        }
      }
    }

    await leave.save();

    const updated = await LeaveRequest.findById(leave._id)
      .populate('employee', 'name email employeeId department')
      .populate('reviewedBy', 'name');

    res.json(updated);
  } catch (error) {
    console.error('Review leave error:', error.message);
    res.status(500).json({ message: 'Server error reviewing leave' });
  }
};

/**
 * @desc    Cancel own leave request
 * @route   PUT /api/leaves/:id/cancel
 * @access  Private (own leave only)
 */
const cancelLeave = async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (leave.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only cancel your own leave requests' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending leave requests can be cancelled' });
    }

    leave.status = 'cancelled';
    await leave.save();

    res.json({ message: 'Leave request cancelled', leave });
  } catch (error) {
    console.error('Cancel leave error:', error.message);
    res.status(500).json({ message: 'Server error cancelling leave' });
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  reviewLeave,
  cancelLeave,
};
