const { logError } = require('./logger');

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
        logError('Async operation failed:', error, req);
        next(error);
    });
};

module.exports = { asyncHandler };