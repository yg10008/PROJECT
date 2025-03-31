const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Custom format for detailed logging
const detailedFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.metadata(),
    winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: detailedFormat,
    transports: [
        new winston.transports.DailyRotateFile({
            filename: path.join(logDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxSize: '20m',
            maxFiles: '14d',
            zippedArchive: true
        }),
        new winston.transports.DailyRotateFile({
            filename: path.join(logDir, 'combined-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d',
            zippedArchive: true
        })
    ],
    exceptionHandlers: [
        new winston.transports.DailyRotateFile({
            filename: path.join(logDir, 'exceptions-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d',
            zippedArchive: true
        })
    ]
});

// Development logging
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

const logError = (message, error, req = null) => {
    const logData = {
        message,
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack
        },
        timestamp: new Date().toISOString()
    };

    if (req) {
        logData.request = {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userId: req.user?._id,
            userAgent: req.headers['user-agent']
        };
    }

    logger.error(logData);
};

const logActivity = (message, data = {}) => {
    logger.info({
        message,
        ...data,
        timestamp: new Date().toISOString()
    });
};

const logPerformance = (operation, duration, metadata = {}) => {
    logger.info({
        type: 'performance',
        operation,
        duration,
        ...metadata,
        timestamp: new Date().toISOString()
    });
};

module.exports = {
    logger,
    logError,
    logActivity,
    logPerformance
};