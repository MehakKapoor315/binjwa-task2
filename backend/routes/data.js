const express = require('express');
const router = express.Router();
const SensitiveData = require('../models/SensitiveData');
const { protect } = require('../middleware/authMiddleware');
const checkNDA = require('../middleware/ndaMiddleware');
const { successResponse, errorResponse } = require('../utils/response');

// @desc Get sensitive data based on role/tier
// @route GET /api/v1/intelligence
router.get('/', protect, checkNDA, async (req, res) => {
    try {
        let query = {};
        
        // Admin sees all
        if (req.user.role !== 'Admin') {
            // Filter by role
            query.allowedRoles = req.user.role;
        }

        // Founders see their own or allowed role
        if (req.user.role === 'Founder') {
            query = {
                $or: [
                    { allowedRoles: 'Founder' },
                    { owner: req.user._id }
                ]
            };
        }

        const data = await SensitiveData.find(query).populate('locked_by', 'name');
        console.log(`🔓 Intelligence accessed by: ${req.user.name} (${req.user.role})`);
        
        return successResponse(res, data);
    } catch (error) {
        return errorResponse(res, error.message, 500, 'SERVER_ERROR');
    }
});

// @desc Get single intelligence record
// @route GET /api/v1/intelligence/:id
router.get('/:id', protect, checkNDA, async (req, res) => {
    try {
        const record = await SensitiveData.findById(req.params.id)
            .populate('locked_by', 'name email role')
            .populate('owner', 'name email role');
            
        if (!record) {
            return errorResponse(res, 'Record not found', 404);
        }

        return successResponse(res, record);
    } catch (error) {
        return errorResponse(res, error.message, 500, 'SERVER_ERROR');
    }
});

// @desc Update intelligence record
// @route PATCH /api/v1/intelligence/:id
router.patch('/:id', protect, async (req, res) => {
    try {
        const record = await SensitiveData.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );
        
        if (!record) {
            return errorResponse(res, 'Record not found', 404);
        }

        return successResponse(res, record, 'Record updated successfully');
    } catch (error) {
        return errorResponse(res, error.message, 500, 'SERVER_ERROR');
    }
});

module.exports = router;
