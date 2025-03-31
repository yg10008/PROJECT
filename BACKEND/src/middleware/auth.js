const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const logger = require('../utils/logger');
const { AppError } = require('./errorHandler');

const auth = async (req, res, next) => {
    try {
        // Get token from different possible locations
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
            .select('-password')  // Exclude password from the result
            .lean();  // For better performance

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found or session expired.'
            });
        }

        // Add user info to request
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        logger.logError('Authentication error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid token.'
        });
    }
};

// Admin middleware
const adminAuth = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
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

module.exports = { auth, adminAuth, checkInstitution }; 