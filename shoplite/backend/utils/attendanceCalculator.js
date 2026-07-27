/**
 * Attendance Calculator Utility — Pure Business Logic Module
 * Encapsulates shift timing calculations, half-day cutoff rules, 
 * working hours evaluation, and status determinations.
 */

/**
 * Converts a 24h time string 'HH:MM' into decimal hours (e.g. '09:30' -> 9.5)
 */
const parseTimeToDecimal = (timeStr) => {
  if (!timeStr) return 0;
  const parts = String(timeStr).split(':').map(Number);
  const hours = parts[0] || 0;
  const minutes = parts[1] || 0;
  return hours + minutes / 60.0;
};

/**
 * Converts decimal hours to human-readable string (e.g. 4.5 -> '4 Hours 30 Minutes', 9.0 -> '9 Hours')
 */
const formatDecimalToHoursMinutes = (decimalHours) => {
  if (isNaN(decimalHours) || decimalHours <= 0) return '0 Hours';
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);

  if (hours > 0 && minutes > 0) {
    return `${hours} Hour${hours !== 1 ? 's' : ''} ${minutes} Minute${minutes !== 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} Hour${hours !== 1 ? 's' : ''}`;
  } else {
    return `${minutes} Minute${minutes !== 1 ? 's' : ''}`;
  }
};

/**
 * Calculates total working hours between shift start and shift end
 */
const calculateWorkingHours = (shiftStart, shiftEnd) => {
  const startDec = parseTimeToDecimal(shiftStart);
  let endDec = parseTimeToDecimal(shiftEnd);
  
  // Handle overnight shift crossing midnight (e.g. 22:00 to 06:00)
  if (endDec < startDec) {
    endDec += 24;
  }
  return Math.max(0, Math.round((endDec - startDec) * 100) / 100);
};

/**
 * Calculates default half-day working hours = Working Hours / 2
 */
const calculateHalfDayWorkingHours = (shiftStart, shiftEnd) => {
  const totalHours = calculateWorkingHours(shiftStart, shiftEnd);
  return Math.round((totalHours / 2) * 100) / 100;
};

/**
 * Validates shift configuration inputs
 */
const validateShiftSettings = ({ officeStartTime, officeEndTime, halfDayThreshold, halfDayWorkingHours, customDeductionAmount }) => {
  const errors = [];

  const startDec = parseTimeToDecimal(officeStartTime);
  let endDec = parseTimeToDecimal(officeEndTime);
  if (endDec < startDec) endDec += 24;

  const totalHours = endDec - startDec;

  if (totalHours <= 0) {
    errors.push('Shift End Time must be later than Shift Start Time.');
  }

  if (halfDayThreshold) {
    const cutoffDec = parseTimeToDecimal(halfDayThreshold);
    if (cutoffDec < startDec || cutoffDec > endDec) {
      errors.push('Half-Day Arrival Cutoff must be between Shift Start and Shift End time.');
    }
  }

  if (halfDayWorkingHours !== undefined && halfDayWorkingHours !== null) {
    const hdHours = Number(halfDayWorkingHours);
    if (isNaN(hdHours) || hdHours < 0) {
      errors.push('Half-Day Working Hours cannot be negative.');
    } else if (hdHours > totalHours) {
      errors.push(`Half-Day Working Hours (${hdHours}h) cannot exceed total shift working hours (${totalHours}h).`);
    }
  }

  if (customDeductionAmount !== undefined && customDeductionAmount !== null) {
    const ded = Number(customDeductionAmount);
    if (isNaN(ded) || ded < 0) {
      errors.push('Attendance deduction cannot be negative.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    totalWorkingHours: totalHours,
  };
};

/**
 * Evaluates attendance status for check-in / check-out based on shift rules
 */
const evaluateAttendance = ({ checkInDate, checkOutDate, rule }) => {
  if (!checkInDate) {
    return { status: 'absent', workedHours: 0, notes: 'No Check-In Recorded' };
  }

  const shiftStart = rule.officeStartTime || '09:00';
  const shiftEnd = rule.officeEndTime || '18:00';
  const cutoff = rule.halfDayThreshold || '13:00';
  
  const startDec = parseTimeToDecimal(shiftStart);
  const cutoffDec = parseTimeToDecimal(cutoff);
  const totalWorkingHours = calculateWorkingHours(shiftStart, shiftEnd);
  const requiredHalfDayHours = rule.halfDayWorkingHours ?? (totalWorkingHours / 2);

  // Parse check-in decimal hour in local time
  const inDt = new Date(checkInDate);
  const checkInDecimalHour = inDt.getHours() + inDt.getMinutes() / 60.0;

  // Calculate worked hours if checked out
  let workedHours = 0;
  if (checkOutDate) {
    const outDt = new Date(checkOutDate);
    const diffMs = outDt - inDt;
    workedHours = Math.max(0, Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100);
  }

  // Condition A: Arrival > Half-Day Arrival Cutoff
  const isLateArrivalCutoff = checkInDecimalHour > cutoffDec;

  if (isLateArrivalCutoff) {
    return {
      status: 'half_day',
      workedHours,
      notes: `Half Day: Checked in after Half-Day Arrival Cutoff (${cutoff})`,
    };
  }

  // If check-out is performed, check Condition B & Condition C & Full Day Rule
  if (checkOutDate) {
    const outDt = new Date(checkOutDate);
    let checkOutDecimalHour = outDt.getHours() + outDt.getMinutes() / 60.0;
    let endDec = parseTimeToDecimal(shiftEnd);

    const isEarlyCheckout = workedHours < requiredHalfDayHours;
    const isCompletedFullShift = workedHours >= requiredHalfDayHours && checkInDecimalHour <= cutoffDec;

    if (isEarlyCheckout) {
      return {
        status: 'half_day',
        workedHours,
        notes: `Half Day: Early checkout before completing required half-day hours (${formatDecimalToHoursMinutes(requiredHalfDayHours)})`,
      };
    }

    if (isCompletedFullShift) {
      return {
        status: 'present',
        workedHours,
        notes: `Present: Completed full day requirements (${formatDecimalToHoursMinutes(workedHours)} worked)`,
      };
    }
  }

  // Default check-in status (pending check-out)
  return {
    status: 'present',
    workedHours,
    notes: `On Time Check-In (Shift Start: ${shiftStart})`,
  };
};

module.exports = {
  parseTimeToDecimal,
  formatDecimalToHoursMinutes,
  calculateWorkingHours,
  calculateHalfDayWorkingHours,
  validateShiftSettings,
  evaluateAttendance,
};
