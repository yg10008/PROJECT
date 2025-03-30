const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const { logError } = require('../utils/logger');

// Rate limiting configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    handler: (req, res) => {
        logError('Rate limit exceeded', new Error('Rate limit exceeded'), { ip: req.ip });
        res.status(429).json({
            message: 'Too many requests from this IP, please try again later'
        });
    }
});

// API specific rate limiter
const apiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1000,
    message: 'Too many API requests from this IP'
});

// Configure security middleware
const securityMiddleware = [
    helmet(), // Set security HTTP headers
    mongoSanitize(), // Sanitize data against NoSQL query injection
    xss(), // Clean user input from malicious HTML/JavaScript XSS
];

module.exports = {
    limiter,
    apiLimiter,
    securityMiddleware
}; 