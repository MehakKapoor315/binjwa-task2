const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { successResponse, errorResponse } = require('../utils/response');
const SensitiveData = require('../models/SensitiveData');
const AuditLog = require('../models/AuditLog');

// @desc Get intelligence feed for dashboard
// @route GET /api/v1/dashboard/intelligence-feed
router.get('/intelligence-feed', protect, async (req, res) => {
    try {
        const feed = await SensitiveData.find({ status: 'published' }).sort('-createdAt').limit(5);
        return successResponse(res, feed);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
});

// @desc Get saved intelligence for dashboard
// @route GET /api/v1/dashboard/saved-intelligence
router.get('/saved-intelligence', protect, async (req, res) => {
    try {
        // Mocking saved intelligence for now
        const saved = await SensitiveData.find({ status: 'published' }).limit(3);
        return successResponse(res, saved);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
});

// @desc Get recent activity for dashboard
// @route GET /api/v1/dashboard/activity
router.get('/activity', protect, async (req, res) => {
    try {
        const activity = await AuditLog.find({ user_id: req.user._id }).sort('-createdAt').limit(10);
        return successResponse(res, activity);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
});

module.exports = router;
