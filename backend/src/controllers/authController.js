const User = require('../models/User');
const Tenant = require('../models/Tenant');
const Otp = require('../models/Otp');
const { sendSuccess, sendError } = require('../utils/response');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Helper to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, company_id: user.company_id },
    process.env.JWT_SECRET || 'supersecretjwtkey_replace_me_in_production',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @desc    Register a new CRM Admin (creates User and placeholder Tenant)
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { full_name, email, phone, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return sendError(res, 'User with this email already exists', 400);
    }

    // 1. Create Placeholder Tenant
    const tenant = await Tenant.create({
      business_name: 'Pending Setup',
      business_email: email,
      status: 'Inactive'
    });

    // 2. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create User
    const user = await User.create({
      company_id: tenant._id,
      role: 'Admin',
      full_name,
      email,
      phone,
      password: hashedPassword
    });

    const token = generateToken(user);

    return sendSuccess(res, {
      user_id: user._id,
      token,
      business_setup_complete: false
    }, 'Registration successful. Please complete business setup.', 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Complete Business Setup for the registered Admin
// @route   POST /api/auth/business-setup
exports.businessSetup = async (req, res) => {
  try {
    const { business_name, logo_url, team_size, website, business_email, business_phone, gst_number } = req.body;
    
    // req.user is set by requireAuth
    const tenant = await Tenant.findById(req.user.company_id);
    
    if (!tenant) {
      return sendError(res, 'Tenant not found', 404);
    }

    // Update Tenant with actual details
    tenant.business_name = business_name;
    tenant.logo_url = logo_url;
    tenant.team_size = team_size;
    tenant.website = website;
    tenant.business_email = business_email;
    tenant.business_phone = business_phone;
    tenant.gst_number = gst_number;
    tenant.status = 'Active';
    await tenant.save();

    return sendSuccess(res, { company_id: tenant._id }, 'Business setup completed successfully', 200);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Generic Login controller logic (used by all portals)
const loginCore = async (req, res, expectedRole = null) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || user.is_deleted) {
      return sendError(res, 'Invalid email or password', 401);
    }

    // Check role if an expectedRole was provided
    if (expectedRole && user.role !== expectedRole) {
      // If it's a generic login, it should only allow Admin/Telecaller
      if (expectedRole === 'CRM_USER' && (user.role === 'SuperAdmin' || user.role === 'SATelecaller')) {
         return sendError(res, 'Invalid login portal for this user role', 401);
      }
      if (expectedRole !== 'CRM_USER' && user.role !== expectedRole) {
         return sendError(res, 'Invalid login portal for this user role', 401);
      }
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password', 401);
    }
    
    if (user.status === 'Inactive') {
      return sendError(res, 'Your account is inactive. Please contact your admin.', 401);
    }

    // Check if business setup is complete (for Admins)
    let business_setup_complete = true;
    if (user.role === 'Admin') {
       const tenant = await Tenant.findById(user.company_id);
       if (tenant && tenant.business_name === 'Pending Setup') {
         business_setup_complete = false;
       }
    }

    const token = generateToken(user);
    const userData = {
      id: user._id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      company_id: user.company_id,
      business_setup_complete
    };

    return sendSuccess(res, { token, user: userData }, 'Login successful', 200);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Login for CRM Users (Admin, Telecaller)
// @route   POST /api/auth/login
exports.login = (req, res) => loginCore(req, res, 'CRM_USER');

// @desc    Login for Super Admin
// @route   POST /api/admin/auth/login
exports.superAdminLogin = (req, res) => loginCore(req, res, 'SuperAdmin');

// @desc    Login for Super Admin Telecaller
// @route   POST /api/sa-telecaller/auth/login
exports.saTelecallerLogin = (req, res) => loginCore(req, res, 'SATelecaller');

// @desc    Forgot Password - generate OTP
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // For security, respond success even if email not found
    if (!user || user.is_deleted) {
      return sendSuccess(res, {}, 'If an account with that email exists, an OTP has been sent.', 200);
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
    
    await Otp.deleteMany({ user_id: user._id }); // Clear old OTPs
    
    await Otp.create({
      user_id: user._id,
      code: otpCode,
      expires_at: new Date(Date.now() + expiryMinutes * 60000)
    });

    // [ASSUMPTION] Log OTP to console instead of sending email
    console.log(`\n\n=== DEV OTP ALERT ===\nOTP for ${email}: ${otpCode}\n=====================\n\n`);

    return sendSuccess(res, { dev_otp: otpCode }, 'If an account with that email exists, an OTP has been sent.', 200);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, 'Invalid OTP or email', 400);
    }

    const otpRecord = await Otp.findOne({ user_id: user._id, code: otp, used: false });
    
    if (!otpRecord) {
      return sendError(res, 'Invalid or expired OTP', 400);
    }

    if (new Date() > otpRecord.expires_at) {
      return sendError(res, 'OTP has expired', 400);
    }

    // Mark used
    otpRecord.used = true;
    await otpRecord.save();

    // Return a short-lived reset token (JWT) to use in the reset-password route
    const otp_reset_token = jwt.sign(
      { id: user._id, purpose: 'password_reset' },
      process.env.JWT_SECRET || 'supersecretjwtkey_replace_me_in_production',
      { expiresIn: '15m' }
    );

    return sendSuccess(res, { otp_reset_token }, 'OTP verified successfully', 200);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp_reset_token, new_password, confirm_password } = req.body;

    if (new_password !== confirm_password) {
      return sendError(res, 'Passwords do not match', 400);
    }

    let decoded;
    try {
      decoded = jwt.verify(otp_reset_token, process.env.JWT_SECRET || 'supersecretjwtkey_replace_me_in_production');
      if (decoded.purpose !== 'password_reset') {
         throw new Error('Invalid token purpose');
      }
    } catch (err) {
      return sendError(res, 'Invalid or expired reset token', 400);
    }

    const user = await User.findOne({ email });
    if (!user || user._id.toString() !== decoded.id) {
       return sendError(res, 'Invalid request', 400);
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(new_password, salt);
    await user.save();

    return sendSuccess(res, {}, 'Password reset successfully', 200);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};
