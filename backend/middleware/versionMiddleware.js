const mongoose = require('mongoose');
const ChangeHistory = require('../models/ChangeHistory');

/**
 * Model name mapping: URL entity segment → Mongoose model name
 * Covers all three tracked collections.
 */
const ENTITY_MODEL_MAP = {
    'intelligence': 'SensitiveData',
    'deals':        'Deal',
    'documents':    'Document'
};

/**
 * Fields that should never appear in change history
 * (internal / lock fields managed by other systems).
 */
const IGNORED_FIELDS = [
    '_id', '__v', 'createdAt', 'updatedAt',
    'locked_by', 'locked_at'
];

/**
 * Compute a granular diff between two plain objects.
 * Returns { old_value, new_value } containing only the fields that changed.
 */
const computeDiff = (oldDoc, newDoc) => {
    const old_value = {};
    const new_value = {};

    // Collect all unique keys from both objects
    const allKeys = new Set([
        ...Object.keys(oldDoc),
        ...Object.keys(newDoc)
    ]);

    for (const key of allKeys) {
        if (IGNORED_FIELDS.includes(key)) continue;

        const oldVal = JSON.stringify(oldDoc[key]);
        const newVal = JSON.stringify(newDoc[key]);

        if (oldVal !== newVal) {
            old_value[key] = oldDoc[key];
            new_value[key] = newDoc[key];
        }
    }

    return { old_value, new_value };
};

/**
 * Version Tracking Middleware
 * 
 * Automatically captures before/after snapshots for every PUT/PATCH
 * on intelligence, deals, and documents collections.
 * 
 * Must be placed AFTER authMiddleware (needs req.user).
 * 
 * Usage in server.js:
 *   app.use(versionMiddleware);
 * 
 * Or on specific routers:
 *   router.put('/:id', versionMiddleware, handler);
 */
const versionMiddleware = async (req, res, next) => {
    // Only intercept update methods
    if (!['PUT', 'PATCH'].includes(req.method)) {
        return next();
    }

    // Parse URL to find entity type and record ID
    // Expected: /api/v1/{entity}/{id}  or  /api/v1/{entity}/{id}/...
    const urlParts = req.originalUrl.split('?')[0].split('/').filter(Boolean);
    // e.g. ['api', 'v1', 'intelligence', '665a...']

    let entitySegment = null;
    let recordId = null;

    for (let i = 0; i < urlParts.length - 1; i++) {
        const segment = urlParts[i];
        const nextSegment = urlParts[i + 1];

        if (ENTITY_MODEL_MAP[segment] && mongoose.Types.ObjectId.isValid(nextSegment)) {
            entitySegment = segment;
            recordId = nextSegment;
            break;
        }
    }

    // Not a tracked entity — skip
    if (!entitySegment || !recordId) {
        return next();
    }

    const modelName = ENTITY_MODEL_MAP[entitySegment];

    try {
        const Model = mongoose.model(modelName);

        // ── Snapshot BEFORE the update ──
        const oldDoc = await Model.findById(recordId).lean();

        if (!oldDoc) {
            // Record doesn't exist — nothing to version-track
            return next();
        }

        // Store snapshot + metadata on req so we can access it after response
        req._versionTracking = {
            entitySegment,
            modelName,
            recordId,
            oldDoc
        };
    } catch (err) {
        // Model not registered or DB error — don't block the request
        console.error('[VersionMiddleware] Pre-snapshot failed:', err.message);
        return next();
    }

    // ── After the response finishes, capture the new state ──
    res.on('finish', async () => {
        // Only log on successful responses
        if (res.statusCode < 200 || res.statusCode >= 300) return;
        if (!req._versionTracking) return;

        const { entitySegment, modelName, recordId, oldDoc } = req._versionTracking;

        try {
            const Model = mongoose.model(modelName);
            const newDoc = await Model.findById(recordId).lean();

            if (!newDoc) return;

            const { old_value, new_value } = computeDiff(oldDoc, newDoc);

            // If nothing actually changed, skip logging
            if (Object.keys(old_value).length === 0) return;

            await ChangeHistory.create({
                entity_type: entitySegment,       // 'intelligence' | 'deals' | 'documents'
                entity_id:   recordId,
                changed_by:  req.user ? req.user._id : null,
                old_value,
                new_value,
                reason:      req.body?.reason || req.headers['x-change-reason'] || null
            });

            console.log(`[VersionMiddleware] Logged change for ${entitySegment}/${recordId}`);
        } catch (err) {
            console.error('[VersionMiddleware] Post-snapshot failed:', err.message);
        }
    });

    next();
};

module.exports = versionMiddleware;
