const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Configure Transporter
 * Uses standard SMTP settings from environment variables.
 */
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
    port: process.env.EMAIL_PORT || 2525,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Generic Send Email function
 */
const sendEmail = async (options) => {
    const mailOptions = {
        from: `LandVista <${process.env.EMAIL_FROM || 'noreply@landvista.com'}>`,
        to: options.email,
        subject: options.subject,
        html: options.html
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[EmailService] Email sent: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`[EmailService] Error sending email: ${error.message}`);
        throw error;
    }
};

/**
 * Platform Link Helper
 */
const platformLink = process.env.PLATFORM_URL || 'http://localhost:5173';

/**
 * 1. User Approved Email
 */
exports.sendUserApprovedEmail = async (user) => {
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #2c3e50;">Welcome to LandVista, ${user.name}!</h2>
            <p>Your access request has been <strong>Approved</strong>.</p>
            <p><strong>Role:</strong> ${user.role}</p>
            <p><strong>Approved at:</strong> ${new Date().toLocaleString()}</p>
            <hr />
            <p>You can now log in and explore available mandates and intelligence data.</p>
            <a href="${platformLink}/login" style="display: inline-block; padding: 10px 20px; background-color: #3498db; color: #fff; text-decoration: none; border-radius: 5px;">Login to Platform</a>
        </div>
    `;

    return sendEmail({
        email: user.email,
        subject: 'Access Approved - LandVista',
        html
    });
};

/**
 * 2. User Rejected Email
 */
exports.sendUserRejectedEmail = async (user, reason) => {
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #c0392b;">Access Request Update</h2>
            <p>Hello ${user.name}, we regret to inform you that your access request was not approved at this time.</p>
            <p><strong>Reason:</strong> ${reason || 'Does not meet current mandate criteria'}</p>
            <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
            <hr />
            <p>If you have any questions, please contact our administrative team.</p>
        </div>
    `;

    return sendEmail({
        email: user.email,
        subject: 'Access Request Update - LandVista',
        html
    });
};

/**
 * 3. NDA Reminder Email
 */
exports.sendNDAReminderEmail = async (user, ndaDetails) => {
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #f39c12;">Action Required: NDA Expiring Soon</h2>
            <p>Hello ${user.name}, your NDA for <strong>${ndaDetails.title}</strong> is set to expire on ${new Date(ndaDetails.expiryDate).toLocaleDateString()}.</p>
            <p>To maintain uninterrupted access to sensitive data, please sign the renewed NDA.</p>
            <hr />
            <a href="${platformLink}/nda" style="display: inline-block; padding: 10px 20px; background-color: #f39c12; color: #fff; text-decoration: none; border-radius: 5px;">View NDA Status</a>
        </div>
    `;

    return sendEmail({
        email: user.email,
        subject: 'NDA Expiry Warning - LandVista',
        html
    });
};

/**
 * 4. Critical Alert Email
 */
exports.sendCriticalAlertEmail = async (user, alert) => {
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #e74c3c;">🚨 CRITICAL ALERT</h2>
            <p>A critical action requires your immediate attention.</p>
            <p><strong>Alert:</strong> ${alert.message}</p>
            <p><strong>Entity:</strong> ${alert.entity_type} (${alert.entity_id})</p>
            <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
            <hr />
            <a href="${platformLink}/alerts" style="display: inline-block; padding: 10px 20px; background-color: #e74c3c; color: #fff; text-decoration: none; border-radius: 5px;">Take Action Now</a>
        </div>
    `;

    return sendEmail({
        email: user.email,
        subject: `CRITICAL ALERT: ${alert.type}`,
        html
    });
};

/**
 * 5. Deal SLA Breach Email
 */
exports.sendSLABreachEmail = async (user, deal) => {
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #e67e22;">⚠️ SLA Breach Warning</h2>
            <p>The deal <strong>${deal.title}</strong> has exceeded its expected response time (SLA).</p>
            <p><strong>Deal ID:</strong> ${deal._id}</p>
            <p><strong>Status:</strong> ${deal.status}</p>
            <p><strong>Detected at:</strong> ${new Date().toLocaleString()}</p>
            <hr />
            <a href="${platformLink}/deals/${deal._id}" style="display: inline-block; padding: 10px 20px; background-color: #e67e22; color: #fff; text-decoration: none; border-radius: 5px;">View Deal Details</a>
        </div>
    `;

    return sendEmail({
        email: user.email,
        subject: 'SLA Breach Notification - LandVista',
        html
    });
};
