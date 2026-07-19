const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/response');
const User = require('../models/User');

const requireAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return sendError(res, 'Not authorized, no token provided', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey_replace_me_in_production');
    
    // Check if user still exists
    const currentUser = await User.findById(decoded.id).select('+role +company_id');
    if (!currentUser) {
      return sendError(res, 'The user belonging to this token does no longer exist.', 401);
    }
    
    // Check if user is inactive or deleted
    if (currentUser.status === 'Inactive' || currentUser.is_deleted) {
      return sendError(res, 'User account is inactive or deleted.', 401);
    }

    req.user = {
      id: currentUser._id,
      role: currentUser.role,
      company_id: currentUser.company_id
    };

    next();
  } catch (error) {
    return sendError(res, 'Not authorized, token failed', 401);
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, 'Not authorized to access this route', 403);
    }
    next();
  };
};

module.exports = { requireAuth, requireRole };
