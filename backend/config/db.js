const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            tlsAllowInvalidCertificates: true // For resolving SSL/Certificate issues in local dev
        });
        // Wait for the connection to be fully established
        await new Promise((resolve) => {
            if (mongoose.connection.readyState === 1) resolve();
            else mongoose.connection.once('connected', resolve);
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log(`Using Database: ${conn.connection.name}`);
        return conn;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
