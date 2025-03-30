const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth, checkRole } = require('../middleware/auth');
const { logActivity, logError } = require('../utils/logger');
const passport = require('passport');
const { validateSignup, validateLogin } = require('../middleware/validators');
const { sendVerificationEmail } = require('../utils/emailService');

// Signup
router.post('/signup', validateSignup, async (req, res) => {
    try {
        const { name, email, password, role, institution } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            logActivity('Signup failed - Email already exists', { email });
            return res.status(400).json({ message: 'Email already registered' });
        }

        const user = new User({ name, email, password, role, institution });
        const verificationToken = user.generateVerificationToken();
        await user.save();

        // Send verification email
        await sendVerificationEmail(user, verificationToken);

        const token = user.generateAuthToken();
        
        logActivity('User signup successful', { userId: user._id });
        res.status(201).json({ user, token });
    } catch (error) {
        logError('Signup error', error);
        res.status(500).json({ message: 'Error during signup' });
    }
});

// Login
router.post('/login', validateLogin, async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await user.comparePassword(password))) {
            logActivity('Login failed - Invalid credentials', { email });
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = user.generateAuthToken();
        
        logActivity('User login successful', { userId: user._id });
        res.json({ user, token });
    } catch (error) {
        logError('Login error', error);
        res.status(500).json({ message: 'Error during login' });
    }
});

// Google OAuth
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

router.get('/google/callback', passport.authenticate('google', { session: false }), 
    async (req, res) => {
        try {
            const token = req.user.generateAuthToken();
            logActivity('Google login successful', { userId: req.user._id });
            res.redirect(`/auth-success?token=${token}`);
        } catch (error) {
            logError('Google auth error', error);
            res.redirect('/auth-error');
        }
    }
);

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('institution');
            
        logActivity('Profile accessed', { userId: user._id });
        res.json(user);
    } catch (error) {
        logError('Profile fetch error', error);
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

// Admin dashboard
router.get('/admin-dashboard', auth, checkRole(['admin']), async (req, res) => {
    try {
        const stats = await Promise.all([
            User.countDocuments(),
            Institution.countDocuments(),
            Image.countDocuments(),
            Performance.countDocuments()
        ]);

        const dashboardData = {
            totalUsers: stats[0],
            totalInstitutions: stats[1],
            totalImages: stats[2],
            totalPerformanceRecords: stats[3],
            recentActivity: await getRecentActivity()
        };

        logActivity('Admin dashboard accessed', { userId: req.user._id });
        res.json(dashboardData);
    } catch (error) {
        logError('Admin dashboard error', error);
        res.status(500).json({ message: 'Error fetching dashboard data' });
    }
});

module.exports = router; 