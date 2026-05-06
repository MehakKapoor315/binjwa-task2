const mongoose = require('mongoose');

const alertEventSchema = new mongoose.Schema({
    alert_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Alert', required: true },
    triggered_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    event_type: { type: String, required: true },
    metadata: { type: Object }
}, { timestamps: true });

module.exports = mongoose.model('AlertEvent', alertEventSchema);
