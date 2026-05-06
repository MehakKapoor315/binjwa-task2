const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
    getNotifications, 
    updatePreferences, 
    getPreferences,
    getUnreadCount 
} = require('../controllers/notificationController');

router.get('/', protect, getNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.get('/preferences', protect, getPreferences);
router.patch('/preferences', protect, updatePreferences);

module.exports = router;
