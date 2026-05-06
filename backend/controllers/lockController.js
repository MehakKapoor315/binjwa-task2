const mongoose = require('mongoose');
const { successResponse, errorResponse } = require('../utils/response');

// Ensure models are loaded so mongoose.model() can find them
require('../models/User');
require('../models/SensitiveData');
require('../models/Deal');
require('../models/Document');

const LOCK_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Map URL entity param → Mongoose model name
 */
const ENTITY_MODEL_MAP = {
    intelligence: 'SensitiveData',
    deals:        'Deal',
    documents:    'Document'
};

const resolveModel = (entity) => {
    const modelName = ENTITY_MODEL_MAP[entity?.toLowerCase()];
    if (!modelName) return null;
    try {
        return mongoose.model(modelName);
    } catch {
        return null;
    }
};

/**
 * Check if a lock is stale (older than 15 min).
 * Returns true if the record has no lock or the lock expired.
 */
const isLockStale = (record) => {
    if (!record.locked_by || !record.locked_at) return true;
    return Date.now() - new Date(record.locked_at).getTime() > LOCK_TIMEOUT_MS;
};

// ─── POST /api/v1/:entity/:id/lock ─────────────────────────────────────────
// @desc    Lock a record to the current user
// @access  Private (any authenticated user)
exports.lockRecord = async (req, res) => {
    try {
        const { entity, id } = req.params;
        const Model = resolveModel(entity);

        if (!Model) {
            return errorResponse(res, `Entity type '${entity}' is not supported`, 400, 'INVALID_ENTITY');
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(res, 'Invalid record ID', 400, 'INVALID_ID');
        }

        const record = await Model.findById(id);
        if (!record) {
            return errorResponse(res, 'Record not found', 404, 'NOT_FOUND');
        }

        const currentUserId = req.user._id.toString();

        // Already locked by the SAME user → refresh the timestamp
        const lockedBy = record.locked_by?._id ? record.locked_by._id : record.locked_by;
        if (lockedBy?.toString() === currentUserId) {
            record.locked_at = new Date();
            await record.save();
            return successResponse(res, {
                locked_by: record.locked_by,
                locked_at: record.locked_at
            }, 'Lock refreshed');
        }

        // Locked by ANOTHER user and lock is still active → 423
        if (record.locked_by && !isLockStale(record)) {
            return errorResponse(res, 'Record is locked by another user', 423, 'RECORD_LOCKED', {
                locked_by: record.locked_by,
                locked_at: record.locked_at
            });
        }

        // Either unlocked or stale lock → grant lock to current user
        record.locked_by = req.user._id;
        record.locked_at = new Date();
        await record.save();

        return successResponse(res, {
            locked_by: record.locked_by,
            locked_at: record.locked_at
        }, 'Record locked successfully');
    } catch (error) {
        console.error('[LockController] lockRecord error:', error);
        return errorResponse(res, error.message, 500, 'SERVER_ERROR');
    }
};

// ─── POST /api/v1/:entity/:id/unlock ───────────────────────────────────────
// @desc    Unlock a record (owner of lock, Admin, or Founder)
// @access  Private
exports.unlockRecord = async (req, res) => {
    try {
        const { entity, id } = req.params;
        const Model = resolveModel(entity);

        if (!Model) {
            return errorResponse(res, `Entity type '${entity}' is not supported`, 400, 'INVALID_ENTITY');
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(res, 'Invalid record ID', 400, 'INVALID_ID');
        }

        const record = await Model.findById(id);
        if (!record) {
            return errorResponse(res, 'Record not found', 404, 'NOT_FOUND');
        }

        // Already unlocked
        if (!record.locked_by) {
            return successResponse(res, null, 'Record is already unlocked');
        }

        // Lock Ownership & Hierarchy Logic
        const currentUserId = req.user._id.toString();
        const lockedBy = record.locked_by._id ? record.locked_by._id : record.locked_by;
        const isLockOwner = lockedBy.toString() === currentUserId;
        
        const holder = await mongoose.model('User').findById(lockedBy);
        const holderRole = holder?.role || 'User';

        let canOverride = false;
        if (req.user.role === 'Founder') {
            canOverride = true; // Founder overrides everyone
        } else if (req.user.role === 'Admin') {
            // Admin overrides everyone except Founder
            canOverride = holderRole !== 'Founder';
        }

        if (!isLockOwner && !canOverride) {
            return errorResponse(res, `This record is locked by a ${holderRole}. You do not have the authority to override this lock.`, 403, 'FORBIDDEN');
        }

        record.locked_by = null;
        record.locked_at = null;
        await record.save();

        return successResponse(res, null, 'Record unlocked successfully');
    } catch (error) {
        console.error('[LockController] unlockRecord error:', error);
        return errorResponse(res, error.message, 500, 'SERVER_ERROR');
    }
};

// ─── GET /api/v1/:entity/:id/lock-status ────────────────────────────────────
// @desc    Check lock status of a record (handy for the frontend)
// @access  Private
exports.getLockStatus = async (req, res) => {
    try {
        const { entity, id } = req.params;
        const Model = resolveModel(entity);

        if (!Model) {
            return errorResponse(res, `Entity type '${entity}' is not supported`, 400, 'INVALID_ENTITY');
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(res, 'Invalid record ID', 400, 'INVALID_ID');
        }

        const record = await Model.findById(id).select('locked_by locked_at').populate('locked_by', 'name email role');
        if (!record) {
            return errorResponse(res, 'Record not found', 404, 'NOT_FOUND');
        }

        const isLocked = !!record.locked_by && !isLockStale(record);

        return successResponse(res, {
            is_locked: isLocked,
            locked_by: isLocked ? record.locked_by : null,
            locked_at: isLocked ? record.locked_at : null
        }, 'Lock status retrieved');
    } catch (error) {
        console.error('[LockController] getLockStatus error:', error);
        return errorResponse(res, error.message, 500, 'SERVER_ERROR');
    }
};
