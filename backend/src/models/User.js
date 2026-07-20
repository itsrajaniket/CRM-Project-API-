const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  role: {
    type: String,
    enum: ['SuperAdmin', 'Admin', 'Telecaller', 'SATelecaller'],
    required: true
  },
  full_name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    select: false // Always exclude password from query results by default
  },
  plain_password: {
    type: String // To show on Admin screen as per Figma
  },
  phone: {
    type: String
  },
  profile_image: {
    type: String
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  is_deleted: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
