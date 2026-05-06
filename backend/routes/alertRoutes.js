const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getAlerts, markAlertAsRead } = require('../controllers/alertController');

router.get('/', protect, getAlerts);
router.patch('/:id/read', protect, markAlertAsRead);

module.exports = router;
