const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    is_read: { type: Boolean, default: false },
    reference_id: { type: mongoose.Schema.Types.ObjectId },
    reference_type: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
