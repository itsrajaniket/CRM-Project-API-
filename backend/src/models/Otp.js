const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  code: {
    type: String,
    required: true // 6-digit
  },
  expires_at: {
    type: Date,
    required: true // now + OTP_EXPIRY_MINUTES
  },
  used: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Otp', otpSchema);
