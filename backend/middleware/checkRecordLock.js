const mongoose = require('mongoose');
const { errorResponse } = require('../utils/response');

const LOCK_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Map URL entity param → Mongoose model name
 * (same map used in lockController)
 */
const ENTITY_MODEL_MAP = {
    intelligence: 'SensitiveData',
    deals:        'Deal',
    documents:    'Document'
};

/**
 * Middleware: checkRecordLock
 *
 * Attach this to any PUT / PATCH / DELETE route that should
 * respect record locks. It reads :entity and :id from req.params.
 *
 * If the record is locked by a *different* user (and the lock
 * is not stale), responds with 423 Locked.
 *
 * Usage in a route file:
 *   router.put('/:entity/:id', protect, checkRecordLock, updateHandler);
 */
const checkRecordLock = async (req, res, next) => {
    try {
        const { entity, id } = req.params;

        // If entity is not one we track locks on, skip
        const modelName = ENTITY_MODEL_MAP[entity?.toLowerCase()];
        if (!modelName) return next();

        if (!mongoose.Types.ObjectId.isValid(id)) return next();

        let Model;
        try {
            Model = mongoose.model(modelName);
        } catch {
            return next(); // model not registered — nothing to guard
        }

        const record = await Model.findById(id).select('locked_by locked_at');
        if (!record) return next(); // let the controller handle 404

        // No lock → proceed
        if (!record.locked_by) return next();

        // Stale lock → treat as unlocked
        const isStale = Date.now() - new Date(record.locked_at).getTime() > LOCK_TIMEOUT_MS;
        if (isStale) return next();

        // Lock belongs to the requesting user → proceed
        if (record.locked_by.toString() === req.user._id.toString()) return next();

        // Locked by another user → 423
        return errorResponse(
            res,
            'Record is locked by another user',
            423,
            'RECORD_LOCKED',
            { locked_by: record.locked_by, locked_at: record.locked_at }
        );
    } catch (error) {
        console.error('[checkRecordLock] Error:', error);
        return next(); // fail-open so lock middleware never blocks unrelated requests
    }
};

module.exports = checkRecordLock;
