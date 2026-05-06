const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');

/**
 * Express Middleware to automatically log critical actions to the database.
 * Auto-detects POST, PUT, PATCH, DELETE requests and logs them upon successful response.
 */
const auditMiddleware = (req, res, next) => {
    // Only intercept state-changing HTTP methods
    const targetMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    
    if (!targetMethods.includes(req.method)) {
        return next();
    }

    // Wait for the response to finish before saving the log
    res.on('finish', async () => {
        // Only log if the action was successful (2xx status codes)
        if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
                // Auto-detect Entity Type from URL (e.g., /api/v1/users/123 -> users)
                const urlParts = req.originalUrl.split('?')[0].split('/').filter(Boolean);
                
                let entityType = 'system';
                let potentialId = null;

                if (urlParts.length > 0) {
                    const lastPart = urlParts[urlParts.length - 1];
                    const secondToLast = urlParts[urlParts.length - 2];
                    
                    // If the last part is a Mongo ID, the entity type is likely the preceding part
                    if (mongoose.Types.ObjectId.isValid(lastPart)) {
                        entityType = secondToLast;
                        potentialId = lastPart;
                    } else {
                        entityType = lastPart;
                    }
                }

                // Determine entity ID (from params, body, or URL)
                let entityId = req.params?.id || req.body?.id || req.body?._id || potentialId;
                
                // Validate if it's a true ObjectId, otherwise set to null
                if (!mongoose.Types.ObjectId.isValid(entityId)) {
                    entityId = null;
                }

                // Map method to action name (e.g., POST -> CREATE_USERS)
                const actionMap = {
                    'POST': 'CREATE',
                    'PUT': 'UPDATE',
                    'PATCH': 'UPDATE',
                    'DELETE': 'DELETE'
                };
                const action = `${actionMap[req.method]}_${entityType.toUpperCase()}`.replace(/-/g, '_');

                // Sanitize body for metadata (never log passwords)
                let safeBody = {};
                if (req.body) {
                    safeBody = { ...req.body };
                    delete safeBody.password;
                    delete safeBody.passwordConfirm;
                }

                // Create the audit log entry
                await AuditLog.create({
                    user_id: req.user ? req.user._id : null, // Uses auth middleware if available
                    action: action,
                    entity_type: entityType,
                    entity_id: entityId,
                    metadata: {
                        method: req.method,
                        path: req.originalUrl,
                        status: res.statusCode,
                        payload: safeBody
                    },
                    ip_address: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
                });

            } catch (error) {
                console.error('AuditLog Auto-Logging Failed:', error.message);
            }
        }
    });

    next();
};

module.exports = auditMiddleware;
