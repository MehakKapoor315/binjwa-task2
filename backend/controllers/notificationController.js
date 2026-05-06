const Notification = require('../models/Notification');
const UserNotificationPreference = require('../models/UserNotificationPreference');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * @desc    Get notifications for logged-in user with pagination
 * @route   GET /api/v1/notifications
 * @access  Private
 */
exports.getNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        
        const query = { user_id: req.user._id };
        const skip = (page - 1) * limit;
        
        const [notifications, total] = await Promise.all([
            Notification.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Notification.countDocuments(query)
        ]);

        return successResponse(res, notifications, 'Notifications retrieved successfully', 200, {
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                total_pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('[NotificationController] getNotifications error:', error);
        return errorResponse(res, error.message, 500, 'SERVER_ERROR');
    }
};

/**
 * @desc    Get notification preferences for logged-in user
 * @route   GET /api/v1/notifications/preferences
 * @access  Private
 */
exports.getPreferences = async (req, res) => {
    try {
        let preferences = await UserNotificationPreference.findOne({ user_id: req.user._id });
        
        if (!preferences) {
            // Return default preferences if not found
            preferences = {
                email: true,
                sms: false,
                in_app: true,
                sla_breaches: true,
                access_requests: true,
                intelligence_updates: true
            };
        }

        return successResponse(res, preferences, 'Notification preferences retrieved successfully');
    } catch (error) {
        console.error('[NotificationController] getPreferences error:', error);
        return errorResponse(res, error.message, 500, 'SERVER_ERROR');
    }
};

/**
 * @desc    Update notification preferences (upsert)
 * @route   PATCH /api/v1/notifications/preferences
 * @access  Private
 */
exports.updatePreferences = async (req, res) => {
    try {
        const preferences = await UserNotificationPreference.findOneAndUpdate(
            { user_id: req.user._id },
            { $set: req.body },
            { new: true, upsert: true, runValidators: true }
        );

        return successResponse(res, preferences, 'Notification preferences updated successfully');
    } catch (error) {
        console.error('[NotificationController] updatePreferences error:', error);
        return errorResponse(res, error.message, 500, 'SERVER_ERROR');
    }
};

/**
 * @desc    Get unread notification count for badge
 * @route   GET /api/v1/notifications/unread-count
 * @access  Private
 */
exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({ 
            user_id: req.user._id, 
            is_read: false 
        });

        return successResponse(res, { unread_count: count }, 'Unread count retrieved');
    } catch (error) {
        console.error('[NotificationController] getUnreadCount error:', error);
        return errorResponse(res, error.message, 500, 'SERVER_ERROR');
    }
};
