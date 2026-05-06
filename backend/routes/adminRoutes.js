const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { getDashboardMetrics } = require('../controllers/adminController');

/**
 * Admin Dashboard Metrics
 * Access: Admin, Founder
 */
router.get('/dashboard', protect, authorize('Admin', 'Founder'), getDashboardMetrics);

module.exports = router;
