const admin = require('../config/firebase-admin');
const User = require('../models/User');
const bcrypt = require('bcrypt');

/**
 * Google Sign In / Sign Up
 * Receives Firebase ID token from frontend, verifies it, creates or logs in user
 */
const googleAuth = async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({
                success: false,
                message: 'ID token is required.'
            });
        }

        // Verify Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { uid, email, name, picture } = decodedToken;

        // Check if user exists, if not create new user
        let user = await User.findOne({ firebaseUid: uid });

        if (!user) {
            // New user - Sign Up
            user = await User.create({
                firebaseUid: uid,
                email: email,
                displayName: name || '',
                photoURL: picture || ''
            });
            console.log('✓ New user created:', email);
        } else {
            // Existing user - Update profile info if needed
            user.displayName = name || user.displayName;
            user.photoURL = picture || user.photoURL;
            await user.save();
            console.log('✓ User logged in:', email);
        }

        return res.status(200).json({
            success: true,
            message: 'Authentication successful.',
            user: {
                id: user._id,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                role: user.role,
                isPasswordSet: user.isPasswordSet
            }
        });
    } catch (error) {
        console.error('Google auth error:', error.message);
        return res.status(401).json({
            success: false,
            message: 'Authentication failed.',
            error: error.message
        });
    }
};

/**
 * Get current user
 * Returns logged-in user's data (from middleware)
 */
const getCurrentUser = async (req, res) => {
    try {
        const user = req.user; // From verifyToken middleware

        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                role: user.role,
                isPasswordSet: user.isPasswordSet
            }
        });
    } catch (error) {
        console.error('Get current user error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to get user details.'
        });
    }
};

/**
 * Logout user
 * Clears session (if cookies used) or returns success
 */
const logout = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            message: 'Logged out successfully.'
        });
    } catch (error) {
        console.error('Logout error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Logout failed.'
        });
    }
};

/**
 * Set/Update Password
 * Allows user to set password for email/password login
 */
const setPassword = async (req, res) => {
    try {
        const { password, confirmPassword, currentPassword } = req.body;
        const user = req.user; // From verifyToken middleware

        // If user already has password set, verify current password
        if (user.isPasswordSet && user.password) {
            if (!currentPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password is required'
                });
            }

            // Verify current password
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }
        }

        // Validation
        if (!password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Password and confirm password are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Update user record
        user.password = hashedPassword;
        user.isPasswordSet = true;
        await user.save();

        console.log('✓ Password set successfully for user:', user.email);

        return res.status(200).json({
            success: true,
            message: 'Password set successfully'
        });
    } catch (error) {
        console.error('Set password error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to set password'
        });
    }
};

/**
 * Verify Current Password
 * Checks if provided password matches user's current password
 */
const verifyCurrentPassword = async (req, res) => {
    try {
        const { currentPassword } = req.body;
        const user = req.user; // From verifyToken middleware

        if (!currentPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password is required'
            });
        }

        // Check if user has password set
        if (!user.isPasswordSet || !user.password) {
            return res.status(400).json({
                success: false,
                message: 'No password set for this account'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Wrong password'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Password verified successfully'
        });
    } catch (error) {
        console.error('Verify current password error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to verify password'
        });
    }
};

/**
 * Email/Password Login
 * Allows user to login with email and password (after setting password via Google)
 */
const emailPasswordLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if password is set
        if (!user.isPasswordSet || !user.password) {
            return res.status(400).json({
                success: false,
                message: 'Password not set. Please use Google Sign In first'
            });
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate Firebase custom token (for frontend to sign in to Firebase)
        const customToken = await admin.auth().createCustomToken(user.firebaseUid);

        console.log('✓ Email/password login successful:', user.email);

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            customToken: customToken,
            user: {
                id: user._id,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                role: user.role,
                isPasswordSet: user.isPasswordSet
            }
        });
    } catch (error) {
        console.error('Email/password login error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
};

module.exports = {
    googleAuth,
    getCurrentUser,
    logout,
    setPassword,
    verifyCurrentPassword,
    emailPasswordLogin
};
