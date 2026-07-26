const mongoose = require('mongoose');

/**
 * AttendanceRule Schema — Custom Office Timings & Automatic Half-Day Governance
 * Allows Admin and HR to dynamically customize office start/end times and late arrival thresholds.
 */
const attendanceRuleSchema = new mongoose.Schema(
  {
    ruleId: {
      type: String,
      default: 'default',
      unique: true,
    },
    officeStartTime: {
      type: String,
      default: '10:00', // standard 10:00 AM check-in
    },
    halfDayThreshold: {
      type: String,
      default: '10:30', // arrivals after 10:30 AM become automatic Half Day
    },
    afternoonThreshold: {
      type: String,
      default: '14:00', // departures or arrivals around/after 2:00 PM counted as Half Day
    },
    officeEndTime: {
      type: String,
      default: '19:00', // standard 7:00 PM check-out
    },
    workingDaysPerMonth: {
      type: Number,
      default: 26, // standard monthly working days for salary calculation
    },
    autoCalculateHalfDay: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AttendanceRule', attendanceRuleSchema);
