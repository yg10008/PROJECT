const winston = require('winston');
const path = require('path');
const DailyRotateFile = require('winston-daily-rotate-file');

const logLevel = process.env.LOG_LEVEL || 'info';

// Define log formats
const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
);

// Create separate loggers for different types of logs
const activityLogger = winston.createLogger({
    format: logFormat,
    transports: [
        new DailyRotateFile({
            filename: path.join(__dirname, '../../logs/activity-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d'
        })
    ]
});

const errorLogger = winston.createLogger({
    format: logFormat,
    transports: [
        new DailyRotateFile({
            filename: path.join(__dirname, '../../logs/error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '30d'
        })
    ]
});

const apiLogger = winston.createLogger({
    format: logFormat,
    transports: [
        new DailyRotateFile({
            filename: path
        })
    ]
});

// Add console transport in non-production environments
if (process.env.NODE_ENV !== 'production') {
    activityLogger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
    errorLogger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
    apiLogger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

const logError = (error, req = null) => {
    const logData = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
    };

    if (req) {
        logData.method = req.method;
        logData.url = req.url;
        logData.ip = req.ip;
        logData.userId = req.user ? req.user._id : null;
    }

    errorLogger.error(logData);
};

const logActivity = (message, req = null) => {
    const logData = {
        message,
        timestamp: new Date().toISOString()
    };

    if (req) {
        logData.method = req.method;
        logData.url = req.url;
        logData.ip = req.ip;
        logData.userId = req.user ? req.user._id : null;
    }

    activityLogger.info(logData);
};

module.exports = {
    activityLogger,
    errorLogger,
    apiLogger,
    logError,
    logActivity
}; 