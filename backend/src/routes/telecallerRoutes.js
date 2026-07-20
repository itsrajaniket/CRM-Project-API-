const express = require('express');
const router = express.Router();
const {
  createTelecaller,
  getTelecallers,
  getTelecallerById,
  updateTelecaller,
  deleteTelecaller,
  toggleStatus,
  getTelecallerAttendance,
  getTelecallerBreaks
} = require('../controllers/telecallerController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

router.use(requireAuth);
router.use(requireRole(['Admin']));

router.route('/')
  .post(createTelecaller)
  .get(getTelecallers);

router.route('/:id')
  .get(getTelecallerById)
  .put(updateTelecaller)
  .delete(deleteTelecaller);

router.patch('/:id/status', toggleStatus);
router.get('/:id/attendance', getTelecallerAttendance);
router.get('/:id/breaks', getTelecallerBreaks);

module.exports = router;
