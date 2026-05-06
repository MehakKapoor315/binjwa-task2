const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ChangeHistory = require('../models/ChangeHistory');
const { protect } = require('../middleware/authMiddleware');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Valid entity types that can be queried for change history.
 * Must match the entity_type values stored by versionMiddleware.
 */
const VALID_ENTITIES = ['intelligence', 'deals', 'documents'];

/**
 * @desc    Get full change history for a specific record
 * @route   GET /api/v1/:entity/:id/history
 * @access  Protected (requires auth token)
 * 
 * Query params:
 *   ?page=1        — Page number (default: 1)
 *   ?limit=20      — Results per page (default: 20, max: 100)
 *   ?from=ISO_DATE — Filter changes from this date
 *   ?to=ISO_DATE   — Filter changes up to this date
 */
router.get('/:entity/:id/history', protect, async (req, res) => {
    try {
        const { entity, id } = req.params;

        // Validate entity type
        if (!VALID_ENTITIES.includes(entity)) {
            return errorResponse(
                res,
                `Invalid entity type '${entity}'. Must be one of: ${VALID_ENTITIES.join(', ')}`,
                400,
                'INVALID_ENTITY'
            );
        }

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(res, 'Invalid record ID format', 400, 'INVALID_ID');
        }

        // Build query filter
        const filter = {
            entity_type: entity,
            entity_id: id
        };

        // Optional date range filtering
        const { from, to } = req.query;
        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to)   filter.createdAt.$lte = new Date(to);
        }

        // Pagination
        const page  = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip  = (page - 1) * limit;

        // Fetch history + total count in parallel
        const [history, total] = await Promise.all([
            ChangeHistory.find(filter)
                .sort({ createdAt: -1 })          // Newest first
                .skip(skip)
                .limit(limit)
                .populate('changed_by', 'name email role')  // Populate user details
                .lean(),
            ChangeHistory.countDocuments(filter)
        ]);

        return successResponse(res, history, 'Change history retrieved successfully', 200, {
            entity,
            record_id: id,
            pagination: {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('[ChangeHistory] Fetch failed:', error.message);
        return errorResponse(res, 'Failed to retrieve change history', 500, 'SERVER_ERROR');
    }
});

module.exports = router;
