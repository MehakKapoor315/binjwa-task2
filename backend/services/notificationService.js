const Alert = require('../models/Alert');
const Notification = require('../models/Notification');
const UserNotificationPreference = require('../models/UserNotificationPreference');
const emailService = require('./emailService');
const User = require('../models/User');

/**
 * Notification Service
 * Orchestrates DB storage (Alerts/Notifications) and External delivery (Email).
 */

/**
 * Trigger an Alert
 * - Saves to Alert collection
 * - Sends email if critical OR if user preferences allow
 */
exports.triggerAlert = async (alertData) => {
    try {
        // 1. Create Alert in DB
        const alert = await Alert.create(alertData);
        
        // 2. Fetch User & Preferences
        const user = await User.findById(alertData.user_id);
        if (!user) return alert;

        const preferences = await UserNotificationPreference.findOne({ user_id: user._id });
        
        // Rules:
        // - Critical alerts always trigger email regardless of user preferences
        // - Non-critical alerts respect 'email_alerts' preference
        const isCritical = alert.severity === 'critical';
        const wantsEmail = preferences ? preferences.email_alerts : true; // default to true if no preference set

        if (isCritical || wantsEmail) {
            try {
                if (isCritical) {
                    await emailService.sendCriticalAlertEmail(user, alert);
                } else {
                    // For non-critical, we could send a generic alert email or specific one
                    // For now, let's just log or send if needed
                    console.log(`[NotificationService] Sending non-critical alert email to ${user.email}`);
                }
            } catch (err) {
                console.error('[NotificationService] Email delivery failed:', err.message);
            }
        }

        return alert;
    } catch (error) {
        console.error('[NotificationService] triggerAlert error:', error);
        throw error;
    }
};

/**
 * Trigger a Notification
 * - Saves to Notification collection
 * - Sends email if user preferences allow
 */
exports.triggerNotification = async (notificationData) => {
    try {
        // 1. Create Notification in DB
        const notification = await Notification.create(notificationData);
        
        // 2. Fetch User & Preferences
        const user = await User.findById(notificationData.user_id);
        if (!user) return notification;

        const preferences = await UserNotificationPreference.findOne({ user_id: user._id });
        
        // Rule: Respect user_notification_preferences for non-critical notifications
        const wantsInApp = preferences ? preferences.inapp_alerts : true;
        const wantsEmail = preferences ? preferences.email_alerts : true;

        // If user disabled in-app, we still save it but maybe flag it? 
        // Usually, 'Notifications' collection IS the in-app delivery.
        
        if (wantsEmail) {
            // Logic for generic notification email could go here
        }

        return notification;
    } catch (error) {
        console.error('[NotificationService] triggerNotification error:', error);
        throw error;
    }
};

/**
 * Trigger NDA Expiry Notification
 * Rule: NDA expiry always notifies user (email + in-app)
 */
exports.triggerNDAExpiry = async (user, ndaDetails) => {
    try {
        // 1. Create In-App Notification
        await Notification.create({
            user_id: user._id,
            type: 'nda_expiry',
            title: 'NDA Expiring Soon',
            message: `Your NDA for ${ndaDetails.title} expires on ${new Date(ndaDetails.expiryDate).toLocaleDateString()}.`,
            reference_id: ndaDetails.id,
            reference_type: 'NDARecord'
        });

        // 2. Create Alert (Warning)
        await Alert.create({
            user_id: user._id,
            type: 'nda_expiry',
            severity: 'warning',
            message: `Action Required: Renew NDA for ${ndaDetails.title}`,
            entity_type: 'NDARecord',
            entity_id: ndaDetails.id
        });

        // 3. Always send Email (as per rule)
        await emailService.sendNDAReminderEmail(user, ndaDetails);

        console.log(`[NotificationService] NDA expiry triggered for ${user.email}`);
    } catch (error) {
        console.error('[NotificationService] triggerNDAExpiry error:', error);
    }
};

/**
 * Trigger SLA Breach Notification
 */
exports.triggerSLABreach = async (user, deal) => {
    try {
        await this.triggerAlert({
            user_id: user._id,
            type: 'sla_breach',
            severity: 'critical',
            message: `SLA Breach detected for deal: ${deal.title}`,
            entity_type: 'Deal',
            entity_id: deal._id
        });

        // Email is handled by triggerAlert because severity is 'critical'
    } catch (error) {
        console.error('[NotificationService] triggerSLABreach error:', error);
    }
};
