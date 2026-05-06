const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    severity: { type: String, enum: ['critical', 'warning', 'info'], required: true },
    message: { type: String, required: true },
    entity_type: { type: String, required: true },
    entity_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    status: { type: String, enum: ['active', 'resolved'], default: 'active' },
    is_read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);
