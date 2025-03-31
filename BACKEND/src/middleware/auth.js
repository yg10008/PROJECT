const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const logger = require('../utils/logger');
const { AppError } = require('./errorHandler');

// Main authentication middleware
const auth = async (req, res, next) => {
    try {
        // Get token from different possible sources
        const token = 
            req.header('Authorization')?.replace('Bearer ', '') || 
            req.cookies.token ||
            req.query.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find user and check if still exists
        const user = await User.findById(decoded.userId)
            .populate('institution', 'name type status')
            .select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found or session expired.'
            });
        }

        // Check if user is verified
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email to access this resource.'
            });
        }

        // Check if user's institution is active (if applicable)
        if (user.institution && user.institution.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Institution account is not active.'
            });
        }

        // Add user info to request
        req.user = user;
        req.token = token;

        // Update last activity
        await User.findByIdAndUpdate(user._id, {
            $set: { lastLogin: new Date() },
            $push: {
                loginHistory: {
                    timestamp: new Date(),
                    ip: req.ip,
                    userAgent: req.headers['user-agent']
                }
            }
        });

        next();
    } catch (error) {
        logger.logError('Authentication error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid token.'
        });
    }
};

// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action.'
            });
        }
        next();
    };
};

// Admin authorization middleware
const adminAuth = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin privileges required.'
            });
        }
        next();
    } catch (error) {
        logger.logError('Admin authorization error:', error);
        res.status(403).json({
            success: false,
            message: 'Authorization failed'
        });
    }
};

// Institution authorization middleware
const institutionAuth = async (req, res, next) => {
    try {
        if (!['admin', 'institution'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Institution privileges required.'
            });
        }
        next();
    } catch (error) {
        logger.logError('Institution authorization error:', error);
        res.status(403).json({
            success: false,
            message: 'Authorization failed'
        });
    }
};

// Middleware to check if user belongs to institution
const checkInstitution = async (req, res, next) => {
    try {
        const institutionId = req.params.institutionId || req.body.institutionId;
        
        if (!institutionId) {
            throw new AppError('Institution ID is required', 400);
        }

        if (req.user.role !== 'admin' && 
            req.user.institution.toString() !== institutionId) {
            throw new AppError('You do not have access to this institution', 403);
        }

        next();
    } catch (error) {
        logger.logError('Institution check error', error);
        next(error);
    }
};

module.exports = { auth, authorize, adminAuth, institutionAuth, checkInstitution }; 