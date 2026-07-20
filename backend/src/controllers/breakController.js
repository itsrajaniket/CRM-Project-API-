const Attendance = require('../models/Attendance');
const Break = require('../models/Break');
const { sendSuccess, sendError } = require('../utils/response');

// @desc    Start a break
// @route   POST /api/breaks/start
exports.startBreak = async (req, res) => {
  try {
    const { break_type, reason } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      user_id: req.user.id,
      date: today
    });

    if (!attendance || attendance.shift_end_time) {
      return sendError(res, 'Must be clocked in to take a break', 400);
    }

    const openBreak = await Break.findOne({
      attendance_id: attendance._id,
      end_time: { $exists: false }
    });

    if (openBreak) {
      return sendError(res, 'Another break is already active', 400);
    }

    if (break_type === 'Other - Personal' && !reason) {
      return sendError(res, 'Reason required for personal breaks', 400);
    }

    const newBreak = await Break.create({
      attendance_id: attendance._id,
      user_id: req.user.id,
      break_type,
      reason,
      start_time: new Date()
    });

    return sendSuccess(res, newBreak, 'Break started successfully', 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    End active break
// @route   PUT /api/breaks/:id/end
exports.endBreak = async (req, res) => {
  try {
    const breakRecord = await Break.findOne({
      _id: req.params.id,
      user_id: req.user.id,
      end_time: { $exists: false }
    });

    if (!breakRecord) {
      return sendError(res, 'Active break not found', 404);
    }

    const now = new Date();
    const durationMinutes = Math.floor((now - breakRecord.start_time) / 60000);

    breakRecord.end_time = now;
    breakRecord.duration_minutes = durationMinutes;
    await breakRecord.save();

    return sendSuccess(res, breakRecord, 'Break ended successfully', 200);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Get currently active break
// @route   GET /api/breaks/active
exports.getActiveBreak = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      user_id: req.user.id,
      date: today
    });

    if (!attendance) return sendSuccess(res, null, 'No active break', 200);

    const openBreak = await Break.findOne({
      attendance_id: attendance._id,
      end_time: { $exists: false }
    });

    return sendSuccess(res, openBreak, 'Active break fetched', 200);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};
