const Lead = require('../models/Lead');
const { sendSuccess, sendError } = require('../utils/response');

// Stub for Notification Phase
const triggerNotification = (company_id, target_user_id, type, title, message) => {
  // TODO: Implement in Phase 7
  console.log(`[NOTIFICATION STUB] ${title}: ${message}`);
};

// @desc    Create a new lead
// @route   POST /api/leads
exports.createLead = async (req, res) => {
  try {
    // 1. Force company_id from token, ignore anything sent in the body
    const leadData = {
      ...req.body,
      company_id: req.user.company_id
    };

    const lead = await Lead.create(leadData);

    // 2. Trigger Notification side-effect
    triggerNotification(
      req.user.company_id,
      null,
      'Lead',
      'New Lead',
      `${lead.full_name} was added as a new lead`
    );

    return sendSuccess(res, lead, 'Lead created successfully', 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Get all leads with pagination and search
// @route   GET /api/leads
exports.getLeads = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Base query: scoped to tenant, exclude deleted
    const query = {
      company_id: req.user.company_id,
      is_deleted: false
    };

    // Add search conditions if provided
    if (search) {
      query.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { phone_number: { $regex: search, $options: 'i' } },
        { email_id: { $regex: search, $options: 'i' } }
      ];
    }

    const leads = await Lead.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Lead.countDocuments(query);

    return sendSuccess(res, {
      leads,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    }, 'Leads fetched successfully', 200);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Get single lead by ID
// @route   GET /api/leads/:id
exports.getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findOne({
      _id: req.params.id,
      company_id: req.user.company_id,
      is_deleted: false
    });

    if (!lead) {
      return sendError(res, 'Lead not found', 404);
    }

    return sendSuccess(res, lead, 'Lead fetched successfully', 200);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Update a lead
// @route   PUT /api/leads/:id
exports.updateLead = async (req, res) => {
  try {
    // Prevent overriding company_id
    if (req.body.company_id) {
      delete req.body.company_id;
    }

    const lead = await Lead.findOneAndUpdate(
      {
        _id: req.params.id,
        company_id: req.user.company_id,
        is_deleted: false
      },
      req.body,
      { new: true, runValidators: true }
    );

    if (!lead) {
      return sendError(res, 'Lead not found', 404);
    }

    return sendSuccess(res, lead, 'Lead updated successfully', 200);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Delete a lead (Soft Delete)
// @route   DELETE /api/leads/:id
exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findOneAndUpdate(
      {
        _id: req.params.id,
        company_id: req.user.company_id,
        is_deleted: false
      },
      { is_deleted: true },
      { new: true }
    );

    if (!lead) {
      return sendError(res, 'Lead not found', 404);
    }

    return sendSuccess(res, {}, 'Lead deleted successfully', 200);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};
