const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth, checkRole } = require('../middleware/auth');
const { logActivity, logError } = require('../utils/logger');
const jwt = require('jsonwebtoken');

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, institution } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        const user = new User({
            name,
            email,
            password,
            role,
            institution
        });

        await user.save();

        // Generate token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '7d'
        });

        logActivity('User registered successfully', req);
        res.status(201).json({ user, token });
    } catch (error) {
        logError(error, req);
        res.status(500).json({ message: 'Error creating user' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '7d'
        });

        logActivity('User logged in successfully', req);
        res.json({ user, token });
    } catch (error) {
        logError(error, req);
        res.status(500).json({ message: 'Error logging in' });
    }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        logError(error, req);
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

// Update user profile
router.patch('/profile', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).json({ message: 'Invalid updates' });
    }

    try {
        updates.forEach(update => req.user[update] = req.body[update]);
        await req.user.save();

        logActivity('User profile updated', req);
        res.json(req.user);
    } catch (error) {
        logError(error, req);
        res.status(500).json({ message: 'Error updating profile' });
    }
});

// Get all users (admin only)
router.get('/', auth, checkRole(['admin']), async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        logError(error, req);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// Update user status (admin only)
router.patch('/:id/status', auth, checkRole(['admin']), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isActive = req.body.isActive;
        await user.save();

        logActivity(`User status updated: ${user._id}`, req);
        res.json(user);
    } catch (error) {
        logError(error, req);
        res.status(500).json({ message: 'Error updating user status' });
    }
});

module.exports = router;