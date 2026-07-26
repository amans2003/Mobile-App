const mongoose = require('mongoose');

/**
 * Attendance Schema — Enterprise HRIS
 * Tracks daily employee check-in / check-out with GPS coordinates,
 * computed work hours, and optional selfie verification.
 */
const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String, // YYYY-MM-DD for fast indexing
      required: true,
    },
    checkIn: {
      time: { type: Date, default: null },
      location: {
        latitude: { type: Number, default: null },
        longitude: { type: Number, default: null },
      },
      selfieUrl: { type: String, default: '' },
    },
    checkOut: {
      time: { type: Date, default: null },
      location: {
        latitude: { type: Number, default: null },
        longitude: { type: Number, default: null },
      },
    },
    workHours: {
      type: Number, // In decimal hours (e.g. 8.5)
      default: 0,
    },
    overtime: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'half_day', 'late', 'on_leave', 'holiday', 'weekend'],
      default: 'absent',
    },
    notes: {
      type: String,
      default: '',
    },
    manualReason: {
      type: String,
      default: '',
    },
    isManuallyEdited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index — one record per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
