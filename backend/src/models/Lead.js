const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  full_name: {
    type: String,
    required: true
  },
  phone_number: {
    type: String,
    required: true
  },
  email_id: {
    type: String
  },
  country: {
    type: String
  },
  state: {
    type: String
  },
  city: {
    type: String
  },
  street: {
    type: String
  },
  pincode: {
    type: String
  },
  customer_interaction: {
    type: String // e.g., "New Lead", "Contacted", "Interested"
  },
  date_time: {
    type: Date
  },
  subject: {
    type: String
  },
  is_deleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Lead', leadSchema);
