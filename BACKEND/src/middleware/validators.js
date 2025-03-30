const { body, param, query, validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

// Helper function to handle validation results
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400);
    }
    next();
};

// Auth validators
const validateSignup = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email address'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('role')
        .isIn(['admin', 'institution_admin', 'teacher'])
        .withMessage('Invalid role'),
    validate
];

const validateLogin = [
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').notEmpty().withMessage('Password is required'),
    validate
];

// Image validators
const validateImage = [
    body('description').optional().trim().isLength({ max: 500 }),
    body('tags').optional().isArray(),
    validate
];

// Performance validators
const validatePerformance = [
    body('metrics').isObject(),
    body('metrics.engagement').isFloat({ min: 0, max: 100 }),
    body('metrics.attendance').isObject(),
    validate
];

// Institution validators
const validateInstitution = [
    body('name').trim().notEmpty().withMessage('Institution name is required'),
    body('type')
        .isIn(['school', 'college', 'university', 'training_center'])
        .withMessage('Invalid institution type'),
    body('address').optional().isObject(),
    body('contactInfo').optional().isObject(),
    validate
];

// Curriculum validators
const validateCurriculum = [
    body('name').trim().notEmpty().withMessage('Curriculum name is required'),
    body('subjects').isArray().withMessage('Subjects must be an array'),
    body('academicYear').isObject().withMessage('Academic year is required'),
    validate
];

module.exports = {
    validateSignup,
    validateLogin,
    validateImage,
    validatePerformance,
    validateInstitution,
    validateCurriculum
}; 