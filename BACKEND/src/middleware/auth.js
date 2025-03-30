const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logError } = require('../utils/logger');
const { AppError } = require('./errorHandler');

const auth = async (req, res, next) => {
    try {
        // Check for token in different places
        const token = req.header('Authorization')?.replace('Bearer ', '') || 
                     req.cookies.token ||
                     req.query.token;
        
        if (!token) {
            throw new AppError('Authentication required', 401);
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new AppError('Token has expired', 401);
            }
            throw new AppError('Invalid token', 401);
        }

        // Find user and check if still exists and is active
        const user = await User.findOne({ 
            _id: decoded.id,
            isActive: true 
        }).select('-password');

        if (!user) {
            throw new AppError('User not found or deactivated', 401);
        }

        // Check if token was issued before password change
        if (user.passwordChangedAt) {
            const changedTimestamp = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
            if (decoded.iat < changedTimestamp) {
                throw new AppError('Password was changed. Please login again', 401);
            }
        }

        // Add user and token to request
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        logError('Authentication error', error);
        next(error);
    }
};

const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new AppError('Authentication required', 401);
        }

        if (!roles.includes(req.user.role)) {
            throw new AppError('You do not have permission to perform this action', 403);
        }

        next();
    };
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
        logError('Institution check error', error);
        next(error);
    }
};

module.exports = {
    auth,
    checkRole,
    checkInstitution
}; 