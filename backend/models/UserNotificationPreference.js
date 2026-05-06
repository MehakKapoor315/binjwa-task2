const mongoose = require('mongoose');

const userNotificationPreferenceSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    email_alerts: { type: Boolean, default: true },
    sms_alerts: { type: Boolean, default: false },
    inapp_alerts: { type: Boolean, default: true },
    nda_reminders: { type: Boolean, default: true },
    deal_updates: { type: Boolean, default: true },
    critical_updates: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('UserNotificationPreference', userNotificationPreferenceSchema);
