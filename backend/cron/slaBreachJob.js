const cron = require('node-cron');
const mongoose = require('mongoose');
const Deal = require('../models/Deal');
const FollowUp = require('../models/FollowUp');
const Alert = require('../models/Alert');
const AlertEvent = require('../models/AlertEvent');
const Notification = require('../models/Notification');
const User = require('../models/User');
const emailService = require('../services/emailService');

/**
 * SLA Breach Detection Job
 * Runs every hour to check for missed deadlines in Deals and Follow-ups.
 */
const startSLABreachJob = () => {
    cron.schedule('0 * * * *', async () => {
        console.log('[Cron] Running SLA Breach Detection...');
        
        try {
            const now = new Date();
            const adminUser = await User.findOne({ role: 'Admin' });

            // 1. Check Deals (next_action_date passed, not Closed)
            const breachedDeals = await Deal.find({
                next_action_date: { $lt: now },
                status: { $ne: 'Closed' }
            }).populate('owner');

            for (const deal of breachedDeals) {
                await processBreach(deal, 'Deal', deal.next_action_date, adminUser);
            }

            // 2. Check Follow-ups (scheduled_for passed, pending)
            const breachedFollowUps = await FollowUp.find({
                scheduled_for: { $lt: now },
                status: 'pending'
            }).populate('owner');

            for (const followUp of breachedFollowUps) {
                await processBreach(followUp, 'FollowUp', followUp.scheduled_for, adminUser);
            }

        } catch (error) {
            console.error('[Cron] SLA Breach Detection Error:', error.message);
        }
    });

    console.log('Background job: SLA Breach Detection initialized (runs hourly).');
};

/**
 * Process a single breach: create alert, notify, and log.
 */
async function processBreach(entity, entityType, deadline, adminUser) {
    try {
        const ownerId = entity.owner?._id || entity.owner;
        if (!ownerId) return;

        // Prevent duplicate alerts for the same entity and deadline
        const existingAlert = await Alert.findOne({
            entity_type: entityType,
            entity_id: entity._id,
            type: 'SLA_BREACH',
            status: 'active'
        });

        if (existingAlert) return;

        const message = `SLA Breach: ${entityType} deadline passed (${new Date(deadline).toLocaleString()})`;

        // 1. Create Alert in DB
        const alert = await Alert.create({
            user_id: ownerId,
            type: 'SLA_BREACH',
            severity: 'critical',
            message: message,
            entity_type: entityType,
            entity_id: entity._id,
            status: 'active'
        });

        // 2. Log in alert_events
        await AlertEvent.create({
            alert_id: alert._id,
            event_type: 'BREACH_DETECTED',
            metadata: {
                deadline,
                entity_title: entity.title || 'Untitled'
            }
        });

        // 3. Send In-App Notifications (Owner + Admin)
        const notificationData = {
            type: 'SLA_BREACH',
            title: 'Critical SLA Breach',
            message: message,
            reference_id: entity._id,
            reference_type: entityType
        };

        await Notification.create({ ...notificationData, user_id: ownerId });
        if (adminUser && adminUser._id.toString() !== ownerId.toString()) {
            await Notification.create({ ...notificationData, user_id: adminUser._id });
        }

        // 4. Send Emails (Owner + Admin)
        const ownerUser = await User.findById(ownerId);
        if (ownerUser) {
            await emailService.sendSLABreachEmail(ownerUser, entity);
        }
        if (adminUser && adminUser._id.toString() !== ownerId.toString()) {
            await emailService.sendSLABreachEmail(adminUser, entity);
        }

        console.log(`[SLA] Breach processed for ${entityType}: ${entity._id}`);

    } catch (err) {
        console.error(`[SLA] Error processing breach for ${entityType} ${entity._id}:`, err.message);
    }
}

module.exports = startSLABreachJob;
