const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  date: {
    type: Date, // normalized to 00:00:00 that day
    required: true
  },
  shift_start_time: {
    type: Date,
    required: true
  },
  shift_end_time: {
    type: Date
  },
  expected_minutes: {
    type: Number,
    default: 540 // 9 hours
  },
  net_work_minutes: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Full Day', 'Half Day', 'Absent'],
    default: 'Active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Attendance', attendanceSchema);
