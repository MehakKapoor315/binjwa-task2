const express = require('express');
const router = express.Router();
const AccessRequest = require('../models/AccessRequest');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const reasonMiddleware = require('../middleware/reasonMiddleware');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../utils/auditLogger');
const emailService = require('../services/emailService');

// @desc Submit Access Request
// @route POST /api/v1/access-requests
router.post('/', async (req, res) => {
    try {
        const { email } = req.body;
        
        // Check for existing pending request
        const existingRequest = await AccessRequest.findOne({ email, status: 'pending' });
        if (existingRequest) {
            return errorResponse(res, 'You already have a pending access request.', 400, 'DUPLICATE_REQUEST');
        }

        const accessRequest = await AccessRequest.create(req.body);

        // Audit Log
        await logActivity(req, 'ACCESS_REQUEST_SUBMITTED', 'ONBOARDING', { 
            email: req.body.email, 
            org: req.body.organization 
        });

        return successResponse(res, accessRequest, 'Access request submitted successfully. Our team will review it.', 201);
    } catch (error) {
        return errorResponse(res, error.message, 500, 'SERVER_ERROR');
    }
});

// @desc List Access Requests (Admin/Founder Only)
// @route GET /api/v1/access-requests
router.get('/', protect, authorize('Admin', 'Founder'), async (req, res) => {
    try {
        const { page = 1, limit = 10, status = 'pending', search = '' } = req.query;
        const skip = (page - 1) * limit;

        let query = { status };
        if (search) {
            query.$or = [
                { full_name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { organization: { $regex: search, $options: 'i' } }
            ];
        }

        const [requests, total] = await Promise.all([
            AccessRequest.find(query).sort('-createdAt').skip(skip).limit(parseInt(limit)),
            AccessRequest.countDocuments(query)
        ]);

        return successResponse(res, requests, 'Requests retrieved successfully', 200, {
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return errorResponse(res, error.message, 500, 'SERVER_ERROR');
    }
});

// @desc Approve Access Request (Dual-Approval Initiated if Admin)
// @route POST /api/v1/access-requests/:id/approve
router.post('/:id/approve', protect, authorize('Admin', 'Founder'), reasonMiddleware, async (req, res) => {
    try {
        const request = await AccessRequest.findById(req.params.id);
        if (!request) return errorResponse(res, 'Request not found', 404);

        const { role, tier, reason } = req.body;

        // If Admin is approving, initiate Dual Approval
        if (req.user.role === 'Admin') {
            // Find an eligible Founder for second approval
            const founder = await User.findOne({ role: 'Founder', status: 'approved' });
            
            if (!founder) {
                return errorResponse(res, 'No Founder available for dual approval', 400);
            }

            // Create Approval Request
            const ApprovalRequestModel = require('../models/ApprovalRequest');
            const approval = await ApprovalRequestModel.create({
                action_type: 'approve_user_access',
                entity_id: request._id,
                entity_type: 'access_request',
                requested_by: req.user._id,
                reason: reason || `Approval request for ${request.full_name}`,
                first_approver_id: req.user._id,
                first_approved_at: new Date(),
                second_approver_id: founder._id,
                status: 'half_approved',
                approval_reason: reason
            });

            // Update access request status
            request.status = 'in_review';
            await request.save();

            // Audit Log
            await logActivity(req, 'ACCESS_APPROVAL_INITIATED', 'ADMIN', { 
                request_id: request._id,
                approval_id: approval._id
            });

            return successResponse(res, { approval, request }, 'First stage approval complete. Routed to Founder for final confirmation.');
        }

        // If Founder is approving (Direct Approval)
        request.status = 'approved';
        request.approval_reason = reason;
        request.reviewed_by = req.user._id;
        request.reviewed_at = new Date();
        await request.save();

        let user = await User.findOne({ email: request.email });
        if (!user) {
            user = await User.create({
                name: request.full_name,
                email: request.email,
                password: 'password123',
                role: role || 'Investor',
                tier: tier || 'preview',
                status: 'approved',
                phone: request.phone,
                designation: request.designation
            });
        }

        await logActivity(req, 'ACCESS_REQUEST_APPROVED', 'ADMIN', { 
            request_id: request._id,
            user_provisioned: user._id,
            reason: reason
        });

        try {
            await emailService.sendUserApprovedEmail(user);
        } catch (emailError) {}

        return successResponse(res, { request, user }, 'Request approved and user provisioned.');
    } catch (error) {
        return errorResponse(res, error.message, 500, 'SERVER_ERROR');
    }
});

// @desc Reject Access Request
// @route POST /api/v1/access-requests/:id/reject
router.post('/:id/reject', protect, authorize('Admin', 'Founder'), reasonMiddleware, async (req, res) => {
    try {
        const request = await AccessRequest.findById(req.params.id);
        if (!request) return errorResponse(res, 'Request not found', 404);

        const { reason } = req.body;

        request.status = 'rejected';
        request.rejection_reason = reason;
        request.reviewed_by = req.user._id;
        request.reviewed_at = new Date();
        await request.save();

        // Audit Log
        await logActivity(req, 'ACCESS_REQUEST_REJECTED', 'ADMIN', { 
            request_id: request._id,
            reason: reason
        });

        // Send Notification Email
        try {
            // We use the request object since the user might not exist in the User collection yet
            await emailService.sendUserRejectedEmail({
                name: request.full_name,
                email: request.email
            }, reason);
        } catch (emailError) {
            console.error('[EmailError] Failed to send rejection email:', emailError.message);
        }

        return successResponse(res, request, 'Request rejected.');
    } catch (error) {
        return errorResponse(res, error.message, 500, 'SERVER_ERROR');
    }
});

module.exports = router;
