const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const ndaRoutes = require('./routes/nda');
const dataRoutes = require('./routes/data');
const accessRequestRoutes = require('./routes/accessRequest');
const alertRoutes = require('./routes/alertRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');


const auditMiddleware = require('./middleware/auditMiddleware');
const versionMiddleware = require('./middleware/versionMiddleware');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Global Audit Middleware
app.use(auditMiddleware);
app.use(versionMiddleware);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/access-requests', accessRequestRoutes);
app.use('/api/v1/approvals', require('./routes/approvals'));

app.use('/api/v1/nda', ndaRoutes);
app.use('/api/v1/intelligence', dataRoutes);
app.use('/api/v1/deals', require('./routes/deals'));
app.use('/api/v1/dashboard', require('./routes/dashboard'));
app.use('/api/v1/alerts', alertRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);

app.get('/', (req, res) => {
    res.send('NDA & Role Management System API is running...');
});

const seedDatabase = require('./config/seeder');
const startLockCleanupJob = require('./cron/lockCleanup');
const startComplianceJob = require('./cron/complianceJob');
const startSLABreachJob = require('./cron/slaBreachJob');
const lockRoutes = require('./routes/lockRoutes');

app.use('/api/v1', lockRoutes);
app.use('/api/v1', require('./routes/changeHistory'));

const startServer = async () => {
    await connectDB();
    await seedDatabase();

    // Start background jobs
    startLockCleanupJob();
    startComplianceJob();
    startSLABreachJob();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
};

startServer();
