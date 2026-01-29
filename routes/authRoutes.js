const express = require('express');
const router = express.Router();
const {
    googleAuth,
    getCurrentUser,
    logout,
    setPassword,
    verifyCurrentPassword,
    emailPasswordLogin
} = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');

// PUBLIC ROUTES (No Authentication Required)

/**
 * POST /api/auth/google
 * Google Sign-In endpoint
 * Body: { idToken: string }
 */
router.post('/google', googleAuth);

/**
 * POST /api/auth/login
 * Email/Password Login endpoint
 * Body: { email: string, password: string }
 */
router.post('/login', emailPasswordLogin);

// PROTECTED ROUTES (Authentication Required)

/**
 * GET /api/auth/current-user
 * Get currently logged-in user's data
 */
router.get('/current-user', verifyToken, getCurrentUser);

/**
 * POST /api/auth/logout
 * Logout current user
 */
router.post('/logout', verifyToken, logout);

/**
 * POST /api/auth/set-password
 * Set or update user password
 * Body: { password: string, confirmPassword: string, currentPassword?: string }
 */
router.post('/set-password', verifyToken, setPassword);

/**
 * POST /api/auth/verify-password
 * Verify user's current password
 * Body: { currentPassword: string }
 */
router.post('/verify-password', verifyToken, verifyCurrentPassword);

module.exports = router;
