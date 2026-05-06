const { errorResponse } = require('../utils/response');

/**
 * Express Middleware to enforce a mandatory 'reason' field for critical actions.
 * 
 * Apply this middleware to critical routes such as:
 * - Reject User
 * - Suspend Account
 * - Override Deal
 * - Delete Signal
 * - Reject Access Request
 */
const reasonMiddleware = (req, res, next) => {
    const { reason } = req.body;

    // Check if reason is missing or just empty whitespace
    if (!reason || typeof reason !== 'string' || reason.trim() === '') {
        return errorResponse(res, 'Reason is mandatory for this action', 400, 'VALIDATION_ERROR');
    }

    // The reason is naturally present in req.body.
    // Our existing auditMiddleware automatically logs the request payload (req.body),
    // so the reason will automatically be captured in the audit_logs under metadata.payload.reason!

    next();
};

module.exports = reasonMiddleware;
