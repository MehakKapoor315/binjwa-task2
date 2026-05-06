const mongoose = require('mongoose');

const ndaRecordSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    nda_version: { type: mongoose.Schema.Types.ObjectId, ref: 'NDAVersion', required: true },
    status: { 
        type: String, 
        enum: ['accepted', 'pending', 'expired', 'reaccept_required'], 
        default: 'accepted' 
    },
    accepted_at: { type: Date, default: Date.now },
    signature_name: { type: String, required: true },
    ip_address: { type: String },
    device_info: { type: String },
    session_id: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('NDARecord', ndaRecordSchema);
