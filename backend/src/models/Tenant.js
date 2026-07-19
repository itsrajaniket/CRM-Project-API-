const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  business_name: {
    type: String,
    required: true
  },
  logo_url: {
    type: String
  },
  team_size: {
    type: String
  },
  website: {
    type: String
  },
  business_email: {
    type: String,
    required: true
  },
  business_phone: {
    type: String
  },
  gst_number: {
    type: String
  },
  subscription_plan_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    default: null
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  is_platform_tenant: {
    type: Boolean,
    default: false // true only for the Super Admin's own internal tenant
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Tenant', tenantSchema);
