const express = require('express');
const router = express.Router();
const NDAVersion = require('../models/NDAVersion');
const NDARecord = require('../models/NDARecord');
const { protect } = require('../middleware/authMiddleware');
const { successResponse, errorResponse } = require('../utils/response');

// @desc Get Latest NDA Version
// @route GET /api/v1/nda/latest
router.get('/latest', protect, async (req, res) => {
    try {
        const latest = await NDAVersion.findOne({ is_active: true }).sort('-effective_date');
        return successResponse(res, latest);
    } catch (error) {
        return errorResponse(res, error.message, 500, 'SERVER_ERROR');
    }
});

// @desc Get User NDA Status
// @route GET /api/v1/nda/status
router.get('/status', protect, async (req, res) => {
    try {
        const latest = await NDAVersion.findOne({ is_active: true }).sort('-effective_date');
        if (!latest) return successResponse(res, { signed: false, status: 'no_version_active' });

        const record = await NDARecord.findOne({ 
            user: req.user._id, 
            nda_version: latest._id,
            status: 'accepted'
        });

        return successResponse(res, { 
            signed: !!record, 
            status: record ? 'accepted' : 'pending',
            accepted_at: record ? record.accepted_at : null,
            current_version: latest.version,
            reaccept_required: false
        });
    } catch (error) {
        return errorResponse(res, error.message, 500, 'SERVER_ERROR');
    }
});

// @desc Accept NDA (Digital Signature)
// @route POST /api/v1/nda/accept
router.post('/accept', protect, async (req, res) => {
    const { nda_version_id, accepted, fullName } = req.body;

    if (!accepted || !fullName) {
        return errorResponse(res, 'NDA acceptance and full name signature are required.', 400, 'VALIDATION_ERROR');
    }

    try {
        const version = await NDAVersion.findById(nda_version_id);
        if (!version) return errorResponse(res, 'Invalid NDA version ID', 404);

        const record = await NDARecord.create({
            user: req.user._id,
            nda_version: version._id,
            status: 'accepted',
            signature_name: fullName,
            ip_address: req.ip,
            device_info: req.headers['user-agent']
        });

        console.log(`✅ NDA Accepted Successfully by: ${req.user.name} (User ID: ${req.user._id})`);
        
        // Audit Log
        const { logActivity } = require('../utils/auditLogger');
        await logActivity(req, 'NDA_ACCEPTED', 'COMPLIANCE', { 
            version_id: version._id, 
            version_name: version.version 
        });

        return successResponse(res, record, 'NDA accepted and audit log created.', 201);
    } catch (error) {
        return errorResponse(res, error.message, 500, 'SERVER_ERROR');
    }
});

module.exports = router;
