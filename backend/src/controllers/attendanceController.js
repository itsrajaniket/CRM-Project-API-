const Attendance = require('../models/Attendance');
const Break = require('../models/Break');
const { sendSuccess, sendError } = require('../utils/response');

// @desc    Clock-in for the day
// @route   POST /api/attendance/clock-in
exports.clockIn = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await Attendance.findOne({
      user_id: req.user.id,
      date: today
    });

    if (existingAttendance) {
      return sendError(res, 'Already clocked in for today', 400);
    }

    const attendance = await Attendance.create({
      user_id: req.user.id,
      company_id: req.user.company_id,
      date: today,
      shift_start_time: new Date()
    });

    return sendSuccess(res, attendance, 'Clock-in successful', 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Clock-out Math Engine
// @route   PUT /api/attendance/clock-out
exports.clockOut = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      user_id: req.user.id,
      date: today
    });

    if (!attendance) {
      return sendError(res, 'Not clocked in today', 400);
    }

    if (attendance.shift_end_time) {
      return sendError(res, 'Already clocked out', 400);
    }

    const now = new Date();
    const confirm = req.query.confirm === 'true';

    // 1. Check for open breaks and auto-close them temporarily for math
    const openBreak = await Break.findOne({ attendance_id: attendance._id, end_time: { $exists: false } });
    let extraBreakMinutes = 0;
    if (openBreak) {
      extraBreakMinutes = Math.floor((now - openBreak.start_time) / 60000);
    }

    // 2. Gross Minutes
    const grossMinutes = Math.floor((now - attendance.shift_start_time) / 60000);

    // 3. Total Break Minutes
    const breaks = await Break.find({ attendance_id: attendance._id, end_time: { $exists: true } });
    const existingBreakMinutes = breaks.reduce((acc, curr) => acc + curr.duration_minutes, 0);
    const totalBreakMinutes = existingBreakMinutes + extraBreakMinutes;

    // 4. Net Work Minutes
    const netWorkMinutes = grossMinutes - totalBreakMinutes;

    // 5. Determine Status
    let status = 'Absent';
    let alertType = 'very_early';

    if (netWorkMinutes >= attendance.expected_minutes) {
      status = 'Full Day';
      alertType = 'full_day';
    } else if (netWorkMinutes >= (attendance.expected_minutes * 0.5)) {
      status = 'Half Day';
      alertType = 'half_day';
    }

    // Two-step process: If confirm=false, just return the alert
    if (!confirm) {
      return sendSuccess(res, {
        status,
        alert_type: alertType,
        net_work_minutes: netWorkMinutes
      }, 'Clock-out calculation preview', 200);
    }

    // If confirm=true, save everything
    if (openBreak) {
      openBreak.end_time = now;
      openBreak.duration_minutes = extraBreakMinutes;
      await openBreak.save();
    }

    attendance.shift_end_time = now;
    attendance.net_work_minutes = netWorkMinutes;
    attendance.status = status;
    await attendance.save();

    return sendSuccess(res, attendance, 'Clock-out successful', 200);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Get today's attendance state
// @route   GET /api/attendance/today
exports.getTodayAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      user_id: req.user.id,
      date: today
    });

    if (!attendance) {
      return sendSuccess(res, null, 'Not clocked in yet', 200);
    }

    return sendSuccess(res, attendance, 'Current shift state fetched', 200);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Get self history
// @route   GET /api/attendance/history
exports.getAttendanceHistory = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) return sendError(res, 'Month and year required', 400);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const records = await Attendance.find({
      user_id: req.user.id,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 });

    const summary = {
      total_days: records.length,
      full_day: records.filter(r => r.status === 'Full Day').length,
      half_day: records.filter(r => r.status === 'Half Day').length,
      absent: records.filter(r => r.status === 'Absent').length,
    };

    return sendSuccess(res, { records, summary }, 'History fetched successfully', 200);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};
