const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Break = require('../models/Break');
const { sendSuccess, sendError } = require('../utils/response');
const bcrypt = require('bcryptjs');

// @desc    Create a new telecaller
// @route   POST /api/telecallers
exports.createTelecaller = async (req, res) => {
  try {
    const { full_name, email, phone, password, profile_image } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return sendError(res, 'User with this email already exists', 400);
    }

    // Hash password for login, but keep plain_password for Admin screen
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const telecaller = await User.create({
      company_id: req.user.company_id,
      role: 'Telecaller',
      full_name,
      email,
      phone,
      password: hashedPassword,
      plain_password: password, // As per Figma request
      profile_image
    });

    return sendSuccess(res, telecaller, 'Telecaller created successfully', 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Get all telecallers for the company
// @route   GET /api/telecallers
exports.getTelecallers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status;

    const query = {
      company_id: req.user.company_id,
      role: 'Telecaller',
      is_deleted: false
    };

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch plain_password since Admin needs to see it per Figma
    const telecallers = await User.find(query)
      .select('full_name email phone status profile_image plain_password createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    return sendSuccess(res, {
      telecallers,
      pagination: { total, page, pages: Math.ceil(total / limit) }
    }, 'Telecallers fetched successfully', 200);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Get single telecaller by ID
// @route   GET /api/telecallers/:id
exports.getTelecallerById = async (req, res) => {
  try {
    const telecaller = await User.findOne({
      _id: req.params.id,
      company_id: req.user.company_id,
      role: 'Telecaller',
      is_deleted: false
    }).select('full_name email phone status profile_image plain_password createdAt');

    if (!telecaller) return sendError(res, 'Telecaller not found', 404);

    return sendSuccess(res, telecaller, 'Telecaller fetched successfully', 200);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Update a telecaller
// @route   PUT /api/telecallers/:id
exports.updateTelecaller = async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData.company_id;
    delete updateData.role;

    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
      updateData.plain_password = req.body.password;
    }

    const telecaller = await User.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id, role: 'Telecaller', is_deleted: false },
      updateData,
      { new: true, runValidators: true }
    ).select('full_name email phone status profile_image plain_password');

    if (!telecaller) return sendError(res, 'Telecaller not found', 404);

    return sendSuccess(res, telecaller, 'Telecaller updated successfully', 200);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Delete a telecaller (Soft delete)
// @route   DELETE /api/telecallers/:id
exports.deleteTelecaller = async (req, res) => {
  try {
    const telecaller = await User.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id, role: 'Telecaller', is_deleted: false },
      { is_deleted: true },
      { new: true }
    );
    if (!telecaller) return sendError(res, 'Telecaller not found', 404);
    return sendSuccess(res, {}, 'Telecaller deleted successfully', 200);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Toggle Status
// @route   PATCH /api/telecallers/:id/status
exports.toggleStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Active', 'Inactive'].includes(status)) {
       return sendError(res, 'Invalid status', 400);
    }
    const telecaller = await User.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id, role: 'Telecaller', is_deleted: false },
      { status },
      { new: true }
    ).select('full_name status');
    
    if (!telecaller) return sendError(res, 'Telecaller not found', 404);
    return sendSuccess(res, telecaller, 'Status updated successfully', 200);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Get Telecaller Attendance History
// @route   GET /api/telecallers/:id/attendance
exports.getTelecallerAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) return sendError(res, 'Month and year required', 400);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const records = await Attendance.find({
      user_id: req.params.id,
      company_id: req.user.company_id,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 });

    const summary = {
      total_days: records.length,
      full_day: records.filter(r => r.status === 'Full Day').length,
      half_day: records.filter(r => r.status === 'Half Day').length,
      absent: records.filter(r => r.status === 'Absent').length,
    };

    return sendSuccess(res, { records, summary }, 'Attendance fetched successfully', 200);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Get Telecaller Breaks for a specific date
// @route   GET /api/telecallers/:id/breaks
exports.getTelecallerBreaks = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return sendError(res, 'Date required (YYYY-MM-DD)', 400);

    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      user_id: req.params.id,
      company_id: req.user.company_id,
      date: queryDate
    });

    if (!attendance) return sendSuccess(res, [], 'No attendance found for this date', 200);

    const breaks = await Break.find({ attendance_id: attendance._id });
    return sendSuccess(res, breaks, 'Breaks fetched successfully', 200);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};
