const { AppError } = require('../middleware/errorHandler');
const { logger } = require('./logger');

// Constants
const EMAIL_REGEX = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const validateEmail = (email) => {
    const isValid = EMAIL_REGEX.test(email);
    if (!isValid) {
        logger.warn(`Invalid email format: ${email}`);
    }
    return isValid;
};

const validatePassword = (password) => {
    const isValid = PASSWORD_REGEX.test(password);
    if (!isValid) {
        logger.warn('Invalid password format');
    }
    return isValid;
};

const validateImageType = (mimetype) => {
    const isValid = ALLOWED_IMAGE_TYPES.includes(mimetype);
    if (!isValid) {
        logger.warn(`Invalid image type: ${mimetype}`);
    }
    return isValid;
};

const validateFileSize = (size, maxSize = MAX_FILE_SIZE) => {
    const isValid = size <= maxSize;
    if (!isValid) {
        logger.warn(`File size ${size} exceeds maximum ${maxSize}`);
    }
    return isValid;
};

const validateObjectId = (id) => {
    const isValid = OBJECT_ID_REGEX.test(id);
    if (!isValid) {
        logger.warn(`Invalid ObjectId: ${id}`);
    }
    return isValid;
};

const validateFields = (object, requiredFields) => {
    const missingFields = requiredFields.filter(field => !object[field]);
    if (missingFields.length > 0) {
        const error = new AppError(
            `Missing required fields: ${missingFields.join(', ')}`,
            400
        );
        logger.warn('Validation failed:', { error: error.message, fields: missingFields });
        throw error;
    }
    return true;
};

module.exports = {
    validateEmail,
    validatePassword,
    validateImageType,
    validateFileSize,
    validateObjectId,
    validateFields,
    // Export constants for testing
    EMAIL_REGEX,
    PASSWORD_REGEX,
    OBJECT_ID_REGEX,
    ALLOWED_IMAGE_TYPES,
    MAX_FILE_SIZE
};