const mongoose = require('mongoose');

const breakSchema = new mongoose.Schema({
  attendance_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attendance',
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  break_type: {
    type: String,
    enum: ['Lunch Break', 'Tea Break', 'Meeting', 'Training', 'Other - Personal'],
    required: true
  },
  reason: {
    type: String
  },
  start_time: {
    type: Date,
    required: true
  },
  end_time: {
    type: Date
  },
  duration_minutes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Break', breakSchema);
