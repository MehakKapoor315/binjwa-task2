const express = require('express');
const router = express.Router();
const ApprovalRequest = require('../models/ApprovalRequest');
const AccessRequest = require('../models/AccessRequest');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const { protect } = require('../middleware/authMiddleware');
const { logActivity } = require('../utils/auditLogger');
const { successResponse, errorResponse } = require('../utils/response');

const allowedRoles = ['Analyst', 'Admin', 'Founder'];

const executeApprovalAction = async (approval) => {
    let actionResult = { success: true };
    if (approval.action_type === 'approve_user_access') {
        const requestToApprove = await AccessRequest.findById(approval.entity_id);
        if (requestToApprove) {
            requestToApprove.status = 'approved';
            requestToApprove.approval_reason = approval.approval_reason || "Dual approval completed";
            await requestToApprove.save();

            let userToApprove = await User.findOne({ email: requestToApprove.email });
            if (!userToApprove) {
                userToApprove = await User.create({
                    name: requestToApprove.full_name,
                    email: requestToApprove.email,
                    password: 'password123',
                    role: 'Investor',
                    tier: 'preview',
                    status: 'approved',
                    phone: requestToApprove.phone,
                    designation: requestToApprove.designation
                });
            } else {
                userToApprove.status = 'approved';
                await userToApprove.save();
            }
            actionResult = { user_id: userToApprove._id, new_status: 'approved', request_id: requestToApprove._id };
        }
    }
    return actionResult;
};

// @desc Get eligible first approvers
// @route GET /api/v1/approvals/users/eligible
router.get('/users/eligible', protect, async (req, res) => {
    try {
        const users = await User.find({
            role: { $in: allowedRoles },
            _id: { $ne: req.user._id },
            status: 'approved'
        }).select('name role email');
        return successResponse(res, users, 'Eligible approvers fetched', 200);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
});

// @desc Create new approval request
// @route POST /api/v1/approvals
router.post('/', protect, async (req, res) => {
    try {
        const { action_type, entity_id, entity_type, reason, first_approver_id } = req.body;

        if (!first_approver_id) {
            return errorResponse(res, 'First approver ID is required', 400);
        }

        const firstApprover = await User.findById(first_approver_id);
        if (!firstApprover) {
            return errorResponse(res, 'First approver user not found', 404);
        }

        if (!allowedRoles.includes(firstApprover.role)) {
            return errorResponse(res, 'Only Analyst, Admin, or Founder can approve', 403);
        }

        if (first_approver_id.toString() === req.user._id.toString()) {
            return errorResponse(res, 'Cannot approve your own request', 400);
        }

        if (!reason || reason.trim() === '') {
            return errorResponse(res, 'Reason is mandatory', 400);
        }

        const approval = await ApprovalRequest.create({
            action_type,
            entity_id,
            entity_type,
            requested_by: req.user._id,
            reason,
            first_approver_id,
            status: 'pending'
        });

        if (entity_type === 'access_request') {
            await AccessRequest.findByIdAndUpdate(entity_id, { status: 'in_review' });
        }

        await logActivity(req, 'APPROVAL_REQUEST_CREATED', 'APPROVAL', {
            approval_id: approval._id,
            action_type,
            entity_id
        });

        await notificationService.triggerAlert({
            user_id: first_approver_id,
            type: 'approval_request',
            severity: 'info',
            message: `You have a new approval request for ${action_type}`,
            entity_type: 'ApprovalRequest',
            entity_id: approval._id
        });

        return successResponse(res, {
            _id: approval._id,
            action_type: approval.action_type,
            status: approval.status,
            requested_by: { name: req.user.name, role: req.user.role },
            first_approver: { name: firstApprover.name, role: firstApprover.role },
            first_approver_id: approval.first_approver_id,
            reason: approval.reason,
            created_at: approval.createdAt
        }, 'Approval request created', 201);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
});

// @desc First approver approves the request
// @route POST /api/v1/approvals/:id/first-approve
router.post('/:id/first-approve', protect, async (req, res) => {
    try {
        const approval = await ApprovalRequest.findById(req.params.id);
        if (!approval) return errorResponse(res, 'Approval request not found', 404);

        if (approval.first_approver_id.toString() !== req.user._id.toString()) {
            return errorResponse(res, 'You are not the designated first approver', 403);
        }

        if (!allowedRoles.includes(req.user.role)) {
            return errorResponse(res, 'Your role cannot approve requests', 403);
        }

        if (approval.first_approved_at) {
            return errorResponse(res, 'You have already approved this request', 400);
        }

        if (approval.status !== 'pending') {
            return errorResponse(res, 'This request has already been processed', 400);
        }

        const { reason } = req.body;
        if (!reason || reason.trim() === '') {
            return errorResponse(res, 'Reason is mandatory', 400);
        }

        approval.approval_reason = reason;

        const current_role = req.user.role;
        let eligible_roles = [];
        
        if (current_role === 'Analyst') {
            eligible_roles = ['Admin', 'Founder'];
        } else if (current_role === 'Admin') {
            eligible_roles = ['Founder'];
        } else if (current_role === 'Founder') {
            // Founder approval is final
            const actionResult = await executeApprovalAction(approval);
            
            approval.status = 'approved';
            approval.first_approved_at = new Date();
            approval.action_executed = true;
            approval.action_result = actionResult;
            await approval.save();
            
            return successResponse(res, {
                _id: approval._id,
                status: 'approved',
                first_approver: {
                    name: req.user.name,
                    role: req.user.role,
                    approved_at: approval.first_approved_at
                },
                approval_reason: approval.approval_reason,
                second_approver: null,
                action_executed: true,
                action_result: actionResult
            }, 'Approved by founder. Action executed.');
        }

        // Auto assign second approver
        const secondApproverCandidates = await User.find({
            role: { $in: eligible_roles },
            _id: { $ne: approval.first_approver_id },
            status: 'approved'
        }).sort({ role: -1, createdAt: 1 }); // crude sort for highest role, earliest created

        if (secondApproverCandidates.length === 0) {
            return errorResponse(res, 'No eligible second approver available', 400);
        }

        const secondApproverUser = secondApproverCandidates[0];
        
        approval.first_approved_at = new Date();
        approval.second_approver_id = secondApproverUser._id;
        approval.status = 'half_approved';
        await approval.save();

        await logActivity(req, 'APPROVAL_FIRST_APPROVED', 'APPROVAL', {
            approval_id: approval._id,
            reason,
            second_approver_id: secondApproverUser._id
        });

        // Notifications
        await notificationService.triggerAlert({
            user_id: secondApproverUser._id,
            type: 'approval_pending_second',
            severity: 'warning',
            message: `${req.user.name} approved ${approval.action_type}. Now awaiting your approval`,
            entity_type: 'ApprovalRequest',
            entity_id: approval._id
        });
        
        await notificationService.triggerAlert({
            user_id: approval.requested_by,
            type: 'approval_status_update',
            severity: 'info',
            message: `First approval done by ${req.user.name}`,
            entity_type: 'ApprovalRequest',
            entity_id: approval._id
        });

        return successResponse(res, {
            _id: approval._id,
            action_type: approval.action_type,
            status: approval.status,
            first_approver: {
                name: req.user.name,
                role: req.user.role,
                approved_at: approval.first_approved_at
            },
            approval_reason: approval.approval_reason,
            second_approver: {
                name: secondApproverUser.name,
                role: secondApproverUser.role,
                approved_at: null
            },
            awaiting_from: secondApproverUser.name
        }, 'Approved by first approver. Waiting for second approver.');
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
});

// @desc Second approver approves -> action executes
// @route POST /api/v1/approvals/:id/second-approve
router.post('/:id/second-approve', protect, async (req, res) => {
    try {
        const approval = await ApprovalRequest.findById(req.params.id)
            .populate('first_approver_id', 'name role')
            .populate('requested_by', 'name');
            
        if (!approval) return errorResponse(res, 'Approval request not found', 404);

        if (approval.status !== 'half_approved') {
            return errorResponse(res, 'This request is not awaiting second approval', 400);
        }

        if (approval.second_approver_id.toString() !== req.user._id.toString()) {
            return errorResponse(res, 'You are not the designated second approver', 403);
        }

        const roleRank = { 'Analyst': 1, 'Admin': 2, 'Founder': 3 };
        if (roleRank[req.user.role] <= roleRank[approval.first_approver_id.role]) {
            return errorResponse(res, 'Your role cannot approve this', 403);
        }

        if (approval.second_approved_at) {
            return errorResponse(res, 'You have already approved this request', 400);
        }

        if (!approval.first_approved_at) {
            return errorResponse(res, 'First approval not complete', 400);
        }

        // Execute action logic
        const actionResult = await executeApprovalAction(approval);

        approval.second_approved_at = new Date();
        approval.status = 'approved';
        approval.action_executed = true;
        approval.action_result = actionResult;
        await approval.save();

        await logActivity(req, 'APPROVAL_SECOND_APPROVED', 'APPROVAL', {
            approval_id: approval._id,
            action_result: actionResult
        });

        await notificationService.triggerAlert({
            user_id: approval.first_approver_id._id,
            type: 'approval_completed',
            severity: 'info',
            message: `Your approval was confirmed by ${req.user.name}`,
            entity_type: 'ApprovalRequest',
            entity_id: approval._id
        });
        
        await notificationService.triggerAlert({
            user_id: approval.requested_by._id,
            type: 'approval_completed',
            severity: 'info',
            message: `Request fully approved and executed`,
            entity_type: 'ApprovalRequest',
            entity_id: approval._id
        });

        return successResponse(res, {
            _id: approval._id,
            status: approval.status,
            first_approver: { name: approval.first_approver_id.name, approved_at: approval.first_approved_at },
            second_approver: { name: req.user.name, approved_at: approval.second_approved_at },
            action_type: approval.action_type,
            action_executed: true,
            action_result: actionResult
        }, 'Approval complete. Action executed successfully.');
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
});

// @desc Reject approval request at any stage
// @route POST /api/v1/approvals/:id/reject
router.post('/:id/reject', protect, async (req, res) => {
    try {
        const approval = await ApprovalRequest.findById(req.params.id);
        if (!approval) return errorResponse(res, 'Approval request not found', 404);

        const isFirstApprover = approval.first_approver_id && approval.first_approver_id.toString() === req.user._id.toString();
        const isSecondApprover = approval.second_approver_id && approval.second_approver_id.toString() === req.user._id.toString();

        if (!isFirstApprover && !isSecondApprover) {
            return errorResponse(res, 'You are not authorized to reject', 403);
        }

        if (approval.status === 'approved') return errorResponse(res, 'Already approved, cannot reject', 400);
        if (approval.status === 'rejected') return errorResponse(res, 'Already rejected', 400);

        const { reason } = req.body;
        if (!reason || reason.trim() === '') {
            return errorResponse(res, 'Reason is mandatory for rejection', 400);
        }

        approval.status = 'rejected';
        approval.rejection_reason = reason;
        
        // Use custom rejection properties if needed or stick to the schema
        approval.rejected_by = req.user._id; 
        approval.rejected_at = new Date();
        await approval.save();

        if (approval.entity_type === 'access_request') {
            await AccessRequest.findByIdAndUpdate(approval.entity_id, {
                status: 'rejected',
                rejection_reason: reason
            });
        }

        await logActivity(req, 'APPROVAL_REJECTED', 'APPROVAL', {
            approval_id: approval._id,
            reason
        });

        // Notify
        await notificationService.triggerAlert({
            user_id: approval.requested_by,
            type: 'approval_rejected',
            severity: 'critical',
            message: `Request rejected by ${req.user.name}. Reason: ${reason}`,
            entity_type: 'ApprovalRequest',
            entity_id: approval._id
        });

        return successResponse(res, {
            _id: approval._id,
            status: approval.status,
            rejected_by: { name: req.user.name, role: req.user.role },
            rejection_reason: reason,
            rejected_at: approval.rejected_at || new Date()
        }, 'Approval request rejected');
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
});

// @desc Get pending approvals
// @route GET /api/v1/approvals/pending
router.get('/pending', protect, async (req, res) => {
    try {
        const approvals = await ApprovalRequest.find({
            status: { $in: ['pending', 'half_approved'] },
            $or: [
                { first_approver_id: req.user._id, status: 'pending', first_approved_at: { $exists: false } },
                { second_approver_id: req.user._id, status: 'half_approved', second_approved_at: { $exists: false } },
                { requested_by: req.user._id } // Allow requesters to see their own pending requests
            ]
        })
        .sort('-createdAt')
        .populate('requested_by', 'name role')
        .populate('first_approver_id', 'name role')
        .populate('second_approver_id', 'name role');

        let awaiting_my_approval = [];
        let awaiting_other = [];

        approvals.forEach(app => {
            let item = {
                _id: app._id,
                action_type: app.action_type,
                status: app.status,
                requested_by: app.requested_by ? { name: app.requested_by.name, role: app.requested_by.role } : null,
                reason: app.reason,
                first_approver: app.first_approver_id ? {
                    name: app.first_approver_id._id.toString() === req.user._id.toString() ? `You (${app.first_approver_id.name})` : app.first_approver_id.name,
                    role: app.first_approver_id.role,
                    approved_at: app.first_approved_at || null
                } : null,
                second_approver: app.second_approver_id ? {
                    name: app.second_approver_id._id.toString() === req.user._id.toString() ? `You (${app.second_approver_id.name})` : app.second_approver_id.name,
                    role: app.second_approver_id.role,
                    approved_at: app.second_approved_at || null
                } : null,
                created_at: app.createdAt
            };

            if (app.first_approver_id && app.first_approver_id._id.toString() === req.user._id.toString()) {
                item.my_role = "first_approver";
                item.awaiting_from = "me";
                awaiting_my_approval.push(item);
            } else if (app.second_approver_id && app.second_approver_id._id.toString() === req.user._id.toString()) {
                item.my_role = "second_approver";
                item.awaiting_from = "me";
                awaiting_my_approval.push(item);
            } else {
                item.my_role = "none";
                item.awaiting_from = "other";
                awaiting_other.push(item);
            }
        });

        return successResponse(res, {
            awaiting_my_approval,
            awaiting_other,
            summary: {
                total_pending: awaiting_my_approval.length + awaiting_other.length,
                awaiting_my_action: awaiting_my_approval.length,
                awaiting_others: awaiting_other.length
            }
        }, 'Pending approvals fetched', 200);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
});

module.exports = router;
