/**
 * One-time migration: stamp locked_by and locked_at fields
 * onto all existing documents so they are visible in MongoDB Atlas.
 *
 * Run:  node migrateLockFields.js
 * Safe to delete this file after running.
 */
const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./config/db');

const COLLECTIONS = ['sensitivedatas', 'deals', 'documents'];

(async () => {
    await connectDB();

    for (const col of COLLECTIONS) {
        try {
            const result = await mongoose.connection.db
                .collection(col)
                .updateMany(
                    { locked_by: { $exists: false } },
                    { $set: { locked_by: null, locked_at: null } }
                );
            console.log(`[${col}] Updated ${result.modifiedCount} document(s)`);
        } catch (err) {
            console.log(`[${col}] Skipped — collection may not exist yet`);
        }
    }

    console.log('\nDone! You can delete this file now.');
    process.exit(0);
})();
