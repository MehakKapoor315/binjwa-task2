const mongoose = require('mongoose');

const sensitiveDataSchema = mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    allowedRoles: [{
        type: String,
        enum: ['Admin', 'Investor', 'Founder', 'Analyst']
    }],

    // Record Locking
    locked_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    locked_at: { type: Date, default: null }
}, { timestamps: true });

const SensitiveData = mongoose.model('SensitiveData', sensitiveDataSchema);
module.exports = SensitiveData;
