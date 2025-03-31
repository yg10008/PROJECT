const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateLogin, validateRegister } = require('../middleware/validators');
const { User } = require('../models/User');
const { sendVerificationEmail } = require('../services/emailService');
const { generateToken } = require('../services/tokenService');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const { asyncHandler } = require('../utils/asyncHandler');

// Register
router.post('/register', validateRegister, asyncHandler(async (req, res) => {
    const { email, password, name, role } = req.body;

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new AppError('Email already registered', 400);
    }

    // Create user
    const user = new User({
        email,
        password,
        name,
        role: role || 'teacher'
    });

    // Generate verification token
    const verificationToken = user.generateVerificationToken();
    await user.save();

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken);

    // Generate auth token
    const token = generateToken(user);

    res.status(201).json({
        success: true,
        data: {
            user: user.toJSON(),
            token
        }
    });
}));

// Login
router.post('/login', validateLogin, asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new AppError('Invalid credentials', 401);
    }

    // Check if user is verified
    if (!user.isVerified) {
        throw new AppError('Please verify your email first', 403);
    }

    // Update login history
    user.lastLogin = new Date();
    user.loginHistory.push({
        timestamp: new Date(),
        ip: req.ip,
        userAgent: req.headers['user-agent']
    });
    await user.save();

    // Generate token
    const token = generateToken(user);

    // Set cookie
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
        success: true,
        data: {
            user: user.toJSON(),
            token
        }
    });
}));

// Verify Email
router.get('/verify/:token', asyncHandler(async (req, res) => {
    const { token } = req.params;

    const user = await User.findOne({
        verificationToken: token,
        verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
        throw new AppError('Invalid or expired verification token', 400);
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.json({
        success: true,
        message: 'Email verified successfully'
    });
}));

// Get Current User
router.get('/me', auth, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .populate('institution', 'name type status');

    res.json({
        success: true,
        data: { user }
    });
}));

// Logout
router.post('/logout', auth, asyncHandler(async (req, res) => {
    res.clearCookie('token');
    
    // Log the logout
    logger.logActivity('User logged out', {
        userId: req.user._id,
        ip: req.ip
    });

    res.json({
        success: true,
        message: 'Logged out successfully'
    });
}));

// Request Password Reset
router.post('/forgot-password', asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        // Return success even if user not found for security
        return res.json({
            success: true,
            message: 'If your email is registered, you will receive a reset link'
        });
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    await sendPasswordResetEmail(user.email, resetToken);

    res.json({
        success: true,
        message: 'Reset password link sent to email'
    });
}));

// Reset Password
router.post('/reset-password/:token', asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        throw new AppError('Invalid or expired reset token', 400);
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
        success: true,
        message: 'Password reset successfully'
    });
}));

module.exports = router; 