const mongoose = require('mongoose');

const accessRequestSchema = mongoose.Schema({
    full_name: { type: String, required: true },
    email: { type: String, required: true },
    organization: { type: String, required: true },
    investor_type: { 
        type: String, 
        required: true,
        enum: ['family_office', 'vc', 'pe', 'angel', 'institutional', 'other']
    },
    capital_band: { type: String, required: true },
    geography: { type: String, required: true },
    purpose: { type: String, required: true },
    phone: { type: String },
    designation: { type: String },
    status: { 
        type: String, 
        enum: ['pending', 'in_review', 'approved', 'rejected'], 
        default: 'pending' 
    },
    rejection_reason: { type: String, default: null },
    approval_reason: { type: String, default: null },
    reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewed_at: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('AccessRequest', accessRequestSchema);
