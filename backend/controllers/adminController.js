const Alert = require('../models/Alert');
const ApprovalRequest = require('../models/ApprovalRequest');
const NDARecord = require('../models/NDARecord');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const Deal = require('../models/Deal');
const AccessRequest = require('../models/AccessRequest');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * @desc    Get Admin Dashboard Metrics
 * @route   GET /api/v1/admin/dashboard
 * @access  Private (Admin, Founder only)
 */
exports.getDashboardMetrics = async (req, res) => {
    try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const [
            activeCriticalAlerts,
            pendingApprovals,
            slaBreachesToday,
            ndasNeedingResign,
            unreadNotifications,
            recentAuditLogs,
            totalDeals,
            breachedDealIds,
            pendingAccessRequests
        ] = await Promise.all([
            // 1. Total active critical alerts
            Alert.countDocuments({ severity: 'critical', status: 'active' }),

            // 2. Total pending approvals
            ApprovalRequest.countDocuments({ status: { $in: ['pending', 'half_approved'] } }),

            // 3. Total SLA breaches today
            Alert.countDocuments({ 
                type: 'SLA_BREACH', 
                createdAt: { $gte: startOfToday } 
            }),

            // 4. Total NDAs needing re-sign
            NDARecord.countDocuments({ status: { $in: ['reaccept_required', 'expired'] } }),

            // 5. Total unread notifications across system
            Notification.countDocuments({ is_read: false }),

            // 6. Recent audit log entries (last 10)
            AuditLog.find()
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('user_id', 'name email role'),

            // 7. Pipeline health components
            Deal.countDocuments(),
            Alert.distinct('entity_id', { 
                entity_type: 'Deal', 
                type: 'SLA_BREACH', 
                status: 'active' 
            }),

            // 8. Pending Access Requests
            AccessRequest.countDocuments({ status: 'pending' })
        ]);

        // Calculate Pipeline Health Score
        const breachedCount = breachedDealIds.length;
        const healthScore = totalDeals > 0 
            ? Math.round(((totalDeals - breachedCount) / totalDeals) * 100) 
            : 100;

        const metrics = {
            critical_alerts_count: activeCriticalAlerts,
            pending_approvals_count: pendingApprovals,
            sla_breaches_today_count: slaBreachesToday,
            ndas_needing_resign_count: ndasNeedingResign,
            unread_notifications_count: unreadNotifications,
            pending_access_requests_count: pendingAccessRequests,
            recent_audit_logs: recentAuditLogs,
            pipeline_health: {
                score: healthScore,
                total_deals: totalDeals,
                breached_deals: breachedCount
            }
        };

        return successResponse(res, metrics, 'Admin dashboard metrics retrieved successfully');
    } catch (error) {
        console.error('[AdminController] getDashboardMetrics error:', error);
        return errorResponse(res, error.message, 500, 'SERVER_ERROR');
    }
};
