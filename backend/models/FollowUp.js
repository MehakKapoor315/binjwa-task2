const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema({
    deal_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal', required: true },
    scheduled_for: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    message: { type: String },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('FollowUp', followUpSchema);
