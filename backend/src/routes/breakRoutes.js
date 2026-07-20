const express = require('express');
const router = express.Router();
const {
  startBreak,
  endBreak,
  getActiveBreak
} = require('../controllers/breakController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

router.use(requireAuth);
// Only Telecallers take these breaks
router.use(requireRole(['Telecaller']));

router.post('/start', startBreak);
router.put('/:id/end', endBreak);
router.get('/active', getActiveBreak);

module.exports = router;
