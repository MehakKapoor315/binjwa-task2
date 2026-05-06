const mongoose = require('mongoose');

const approvalRequestSchema = new mongoose.Schema({
    action_type: { type: String, required: true },
    entity_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    entity_type: { type: String, required: true },
    requested_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String },
    first_approver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    first_approved_at: { type: Date },
    second_approver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    second_approved_at: { type: Date },
    status: { 
        type: String, 
        enum: ['pending', 'half_approved', 'approved', 'rejected'], 
        default: 'pending' 
    },
    approval_reason: { type: String },
    rejection_reason: { type: String },
    action_executed: { type: Boolean, default: false },
    action_result: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('ApprovalRequest', approvalRequestSchema);
