const AuditLog = require('../models/AuditLog');

const logActivity = async (req, action, module, details = {}) => {
    try {
        await AuditLog.create({
            user_id: req.user ? req.user._id : null,
            action: action,
            entity_type: module || 'SYSTEM',
            metadata: {
                details: details,
                user_agent: req.headers['user-agent'],
                request_id: req.headers['x-request-id'] || 'req_' + Math.random().toString(36).substr(2, 9)
            },
            ip_address: req.ip
        });
    } catch (error) {
        console.error('Audit Log Error:', error);
    }
};

module.exports = { logActivity };
