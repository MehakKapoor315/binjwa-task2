const cron = require('node-cron');
const mongoose = require('mongoose');

// Ensure models are registered before cron tries to use them
require('../models/SensitiveData');
require('../models/Deal');
require('../models/Document');

const LOCK_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const MODELS_TO_CHECK = ['SensitiveData', 'Deal', 'Document'];

/**
 * Background job: auto-unlock records that have been locked
 * for longer than 15 minutes.
 *
 * Runs every minute via node-cron.
 */
const startLockCleanupJob = () => {
    cron.schedule('* * * * *', async () => {
        const cutoff = new Date(Date.now() - LOCK_TIMEOUT_MS);

        for (const modelName of MODELS_TO_CHECK) {
            try {
                const Model = mongoose.model(modelName);

                const result = await Model.updateMany(
                    {
                        locked_by: { $ne: null },
                        locked_at: { $lte: cutoff }
                    },
                    { $set: { locked_by: null, locked_at: null } }
                );

                if (result.modifiedCount > 0) {
                    console.log(
                        `[Cron:LockCleanup] Auto-unlocked ${result.modifiedCount} stale record(s) in ${modelName}`
                    );
                }
            } catch (err) {
                // Model may not be registered yet on first tick — skip silently
                if (err.name !== 'MissingSchemaError') {
                    console.error(`[Cron:LockCleanup] Error processing ${modelName}:`, err.message);
                }
            }
        }
    });

    console.log('[Cron] Lock cleanup job started — auto-unlocks records after 15 min (checks every 1 min).');
};

module.exports = startLockCleanupJob;
