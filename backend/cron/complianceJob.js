const cron = require('node-cron');
const NDARecord = require('../models/NDARecord');
const User = require('../models/User');
const Notification = require('../models/Notification');
const notificationService = require('../services/notificationService');

/**
 * Compliance Background Job
 * 
 * Runs daily at 1:00 AM.
 * Tasks:
 * 1. Find NDAs expiring in 7 days (assuming 1-year validity).
 * 2. Send reminders to users.
 */
const startComplianceJob = () => {
    // Run at 01:00 every day
    cron.schedule('0 1 * * *', async () => {
        console.log('[Cron] Running Compliance Job (NDA Expiry Checks)...');
        
        try {
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            
            // "Expiring in 7 days" means accepted exactly 358 days ago
            // For a robust check, let's look for records between 358 and 359 days old
            const startRange = new Date(oneYearAgo);
            startRange.setDate(startRange.getDate() + 7);
            
            const endRange = new Date(startRange);
            endRange.setDate(endRange.getDate() + 1);

            const expiringSoon = await NDARecord.find({
                status: 'accepted',
                accepted_at: { $gte: startRange, $lt: endRange }
            }).populate('user');

            console.log(`[Cron] Found ${expiringSoon.length} NDAs expiring in 7 days.`);

            for (const record of expiringSoon) {
                if (!record.user) continue;

                // Check if we already sent a reminder recently to avoid duplicates
                const existing = await Notification.findOne({
                    user_id: record.user._id,
                    type: 'nda_expiry',
                    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                });

                if (!existing) {
                    await notificationService.triggerNDAExpiry(record.user, {
                        id: record._id,
                        title: `NDA Version ${record.nda_version}`, // Ideally fetch version string
                        expiryDate: new Date(record.accepted_at.getTime() + 365 * 24 * 60 * 60 * 1000)
                    });
                }
            }

        } catch (error) {
            console.error('[Cron] Compliance Job Failed:', error.message);
        }
    });

    console.log('Background job: Compliance Monitor initialized (runs daily at 1 AM).');
};

module.exports = startComplianceJob;
