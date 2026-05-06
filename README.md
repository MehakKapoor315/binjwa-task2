# LandVista: Senior Real Estate Intelligence & Governance Platform

LandVista is a high-performance, proprietary real estate intelligence platform designed for collaborative asset management and strictly audited governance. It features a robust dual-approval system, hierarchical record locking, and comprehensive compliance monitoring.

## 🚀 Key Features

### 1. Advanced Governance & Security
- **Hierarchical Role System**: Multi-tier access control (Founder, Admin, Analyst, Investor).
- **NDA Guard**: Mandatory NDA acceptance for all intelligence-accessing roles, fully audited.
- **Dual-Approval Workflow**: Critical actions (like user onboarding) require a two-stage verification process (e.g., Admin initiates, Founder confirms).
- **Audit Logging**: Every sensitive action—from intelligence access to record changes—is recorded with timestamps, user metadata, and rationale.

### 2. Market Intelligence & Deals
- **Record Management**: Centralized repository for intelligence and deal pipeline.
- **Hierarchical Locking**: Exclusive record editing with a governance-aware hierarchy. Founders can override any lock, while Admins are restricted from overriding Founder-held locks.
- **Version Control**: Tracking of all changes made to sensitive data points.

### 3. Automated Compliance
- **Lock Cleanup**: Automated cron jobs to release inactive locks after 15 minutes of inactivity.
- **SLA Breach Detection**: Hourly monitoring for delayed approvals or governance breaches.
- **Daily Compliance Audits**: Background jobs to verify platform integrity.

### 4. Email Notification System
- **Governance Alerts**: Automated emails sent for new approval requests, status updates, and critical system events.
- **Onboarding Communication**: Professional emails sent to applicants upon approval (with credentials) or rejection (with reason).
- **Secure SMTP**: Integrated with secure email providers for reliable delivery.

### 5. Background Monitoring & Cron Jobs
- **Lock Cleanup**: Auto-releases inactive record locks after 15 minutes.
- **Compliance Monitor**: Daily checks for governance adherence.
- **SLA Breach Detection**: Hourly monitoring for delayed approvals.

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Vanilla CSS (Modern Premium UI), Lucide Icons, React-Router-DOM.
- **Backend**: Node.js, Express, Mongoose (MongoDB Atlas).
- **Infrastructure**: JWT Authentication, Node-Cron, Winston/Audit Logging.

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas Account

### Backend Setup
1. Navigate to the `backend` directory.
2. Install dependencies: `npm install`
3. Configure your `.env` file:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_uri
   JWT_SECRET=your_secret
   EMAIL_USER=your_email
   EMAIL_PASS=your_app_password
   ```
4. Start the server: `npm run dev`

### Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

## 🛡️ Governance Hierarchy
| Role | Access Tier | Lock Authority | Approval Power |
| :--- | :--- | :--- | :--- |
| **Founder** | Full Platform | Ultimate Override | Final Sign-off |
| **Admin** | Management | Override (non-Founder) | Stage 1 / Vetting |
| **Analyst** | Intelligence | Own Locks Only | Initiate Requests |
| **Investor** | Preview/Intelligence| Read-only | N/A |

---

Developed for **Advanced Agentic Coding** compliance.
