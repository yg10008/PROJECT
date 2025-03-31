const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

// Create logs directory path properly
const logDir = path.join(__dirname, '../../logs');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.DailyRotateFile({
            filename: path.join(logDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxSize: '20m',
            maxFiles: '14d'
        }),
        new winston.transports.DailyRotateFile({
            filename: path.join(logDir, 'combined-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d'
        })
    ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

module.exports = {
    logger,
    logError: (message, error) => {
        logger.error({
            message,
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            }
        });
    },
    logActivity: (message, data = {}) => {
        logger.info({
            message,
            ...data
        });
    }
}; 