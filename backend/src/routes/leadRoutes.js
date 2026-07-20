const express = require('express');
const router = express.Router();
const {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead
} = require('../controllers/leadController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

// All lead routes require authentication and the 'Admin' role (CRM User)
router.use(requireAuth);
router.use(requireRole(['Admin']));

router.route('/')
  .post(createLead)
  .get(getLeads);

router.route('/:id')
  .get(getLeadById)
  .put(updateLead)
  .delete(deleteLead);

module.exports = router;
