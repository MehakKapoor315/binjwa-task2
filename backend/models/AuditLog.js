const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    entity_type: { type: String, required: true },
    entity_id: { type: mongoose.Schema.Types.ObjectId },
    metadata: { type: Object },
    ip_address: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
