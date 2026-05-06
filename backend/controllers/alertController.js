const Alert = require('../models/Alert');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * @desc    Get alerts for logged-in user with filters and pagination
 * @route   GET /api/v1/alerts
 * @access  Private
 */
exports.getAlerts = async (req, res) => {
    try {
        const { severity, status, page = 1, limit = 10 } = req.query;
        
        const query = { user_id: req.user._id };
        
        if (severity) {
            query.severity = severity;
        }
        
        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;
        
        const [alerts, total] = await Promise.all([
            Alert.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Alert.countDocuments(query)
        ]);

        return successResponse(res, alerts, 'Alerts retrieved successfully', 200, {
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                total_pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('[AlertController] getAlerts error:', error);
        return errorResponse(res, error.message, 500, 'SERVER_ERROR');
    }
};

/**
 * @desc    Mark an alert as read
 * @route   PATCH /api/v1/alerts/:id/read
 * @access  Private
 */
exports.markAlertAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        
        const alert = await Alert.findOneAndUpdate(
            { _id: id, user_id: req.user._id },
            { is_read: true },
            { new: true }
        );

        if (!alert) {
            return errorResponse(res, 'Alert not found or unauthorized', 404, 'NOT_FOUND');
        }

        return successResponse(res, alert, 'Alert marked as read');
    } catch (error) {
        console.error('[AlertController] markAlertAsRead error:', error);
        return errorResponse(res, error.message, 500, 'SERVER_ERROR');
    }
};
