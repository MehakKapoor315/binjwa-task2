const connectDB = require('./config/db');
const User = require('./models/User');
const AuditLog = require('./models/AuditLog');
require('dotenv').config();

async function check() {
  await connectDB();
  const users = await User.find({}, 'email last_login_at').lean();
  console.log('--- USERS ---');
  console.log(users);
  const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(5).lean();
  console.log('--- AUDIT LOGS (latest 5) ---');
  console.log(logs);
  process.exit(0);
}
check();
