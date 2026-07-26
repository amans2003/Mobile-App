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

    // Check leave balance for paid leave types
    const user = await User.findById(req.user._id);
    const paidLeaveTypes = ['pto', 'sick', 'casual'];
    if (paidLeaveTypes.includes(leaveType)) {
      const balance = user.leaveBalances[leaveType] || 0;
      if (totalDays > balance) {
        return res.status(400).json({
          message: `Insufficient ${leaveType.toUpperCase()} balance. Available: ${balance} days, Requested: ${totalDays} days`,
        });
      }
    }

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
    const { status, reviewerNotes } = req.body;

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

    // If approved, deduct from leave balance
    if (status === 'approved') {
      const paidLeaveTypes = ['pto', 'sick', 'casual'];
      if (paidLeaveTypes.includes(leave.leaveType)) {
        const user = await User.findById(leave.employee);
        if (user) {
          user.leaveBalances[leave.leaveType] = Math.max(
            0,
            (user.leaveBalances[leave.leaveType] || 0) - leave.totalDays
          );
          await user.save();
        }
        
        // Automatically register approved paid leaves in the attendance register as "on_leave"
        // This ensures the payroll engine counts these days as 100% present with ZERO salary deduction!
        let currDate = new Date(leave.startDate);
        const endDt = new Date(leave.endDate);
        while (currDate <= endDt) {
          const dateStr = currDate.toISOString().split('T')[0];
          await Attendance.findOneAndUpdate(
            { employee: leave.employee, date: dateStr },
            {
              employee: leave.employee,
              date: dateStr,
              status: 'on_leave',
              notes: `Approved Paid Leave (${leave.leaveType.toUpperCase()}) - Zero Salary Deduction`,
              workHours: 8,
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
