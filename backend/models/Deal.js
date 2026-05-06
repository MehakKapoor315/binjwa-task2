const mongoose = require('mongoose');

const dealSchema = mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    status: {
        type: String,
        enum: ['Conversation', 'Qualified', 'Serious', 'Mandate', 'Closed', 'Cancelled'],
        default: 'Conversation'
    },
    value: { type: Number },
    next_action_date: { type: Date },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Record Locking
    locked_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    locked_at: { type: Date, default: null }
}, { timestamps: true });

const Deal = mongoose.model('Deal', dealSchema);
module.exports = Deal;
