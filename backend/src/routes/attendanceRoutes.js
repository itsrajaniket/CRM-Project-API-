const express = require('express');
const router = express.Router();
const {
  clockIn,
  clockOut,
  getTodayAttendance,
  getAttendanceHistory
} = require('../controllers/attendanceController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

router.use(requireAuth);
// Only Telecallers clock their own attendance
router.use(requireRole(['Telecaller']));

router.post('/clock-in', clockIn);
router.put('/clock-out', clockOut);
router.get('/today', getTodayAttendance);
router.get('/history', getAttendanceHistory);

module.exports = router;
