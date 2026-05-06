const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc Auth user & get token
// @route POST /api/v1/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const allowedEmails = [
        'admin@example.com',
        'investor@example.com',
        'founder@example.com',
        'analyst@example.com'
    ];

    if (!allowedEmails.includes(email)) {
        return errorResponse(res, 'Access denied. This email is not authorized for this module.', 401, 'UNAUTHORIZED');
    }

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            // Update last login
            user.last_login_at = new Date();
            await user.save();

            // Attach user to req so the audit logger captures their ID
            req.user = user;
            
            // Audit Log
            const { logActivity } = require('../utils/auditLogger');
            await logActivity(req, 'LOGIN_SUCCESS', 'AUTH', { email: user.email });

            return successResponse(res, {
                token: generateToken(user._id),
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    tier: user.tier || 'preview',
                    status: user.status
                },
                next_step: "dashboard"
            });
        } else {
            return errorResponse(res, 'Invalid credentials', 401, 'INVALID_CREDENTIALS');
        }
    } catch (error) {
        console.error('LOGIN ERROR:', error);
        return errorResponse(res, error.message, 500, 'SERVER_ERROR');
    }
});

// Logout (Dummy for now as we use JWT)
router.post('/logout', (req, res) => {
    return successResponse(res, {}, 'Logged out successfully');
});

module.exports = router;
