const express = require('express');
const router = express.Router();
const Deal = require('../models/Deal');
const { protect } = require('../middleware/authMiddleware');
const { successResponse, errorResponse } = require('../utils/response');

// @desc Get all deals
// @route GET /api/v1/deals
router.get('/', protect, async (req, res) => {
    try {
        const deals = await Deal.find().populate('owner', 'name email');
        return successResponse(res, deals);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
});

// @desc Create a new deal
// @route POST /api/v1/deals
router.post('/', protect, async (req, res) => {
    try {
        const deal = await Deal.create({
            ...req.body,
            owner: req.user._id
        });
        return successResponse(res, deal, 'Deal created successfully', 201);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
});

// @desc Get single deal
// @route GET /api/v1/deals/:id
router.get('/:id', protect, async (req, res) => {
    try {
        const deal = await Deal.findById(req.params.id).populate('owner', 'name email');
        if (!deal) return errorResponse(res, 'Deal not found', 404);
        return successResponse(res, deal);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
});

module.exports = router;
