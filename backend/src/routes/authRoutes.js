const express = require('express');
const router = express.Router();
const { 
  register, 
  businessSetup, 
  login, 
  superAdminLogin, 
  saTelecallerLogin, 
  forgotPassword, 
  verifyOtp, 
  resetPassword 
} = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

// CRM User / Telecaller Auth Routes
router.post('/register', register);

// Common Login Endpoint Handler (figures out which role based on path)
router.post('/login', (req, res, next) => {
  if (req.baseUrl.includes('/admin')) {
    return superAdminLogin(req, res);
  } else if (req.baseUrl.includes('/sa-telecaller')) {
    return saTelecallerLogin(req, res);
  } else {
    return login(req, res);
  }
});

// Business Setup (requires partial token from register)
router.post('/business-setup', requireAuth, businessSetup);

// Password Reset Flow
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

module.exports = router;
