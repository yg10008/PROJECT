const { body, param, query, validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

// Helper function to handle validation results
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'error',
            errors: errors.array()
        });
    }
    next();
};

// Auth validators
const validateRegistration = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Invalid email format'),
    
    body('password')
        .trim()
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    
    body('role')
        .optional()
        .isIn(['admin', 'teacher', 'institution'])
        .withMessage('Invalid role')
];

const validateLogin = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Invalid email format'),
    
    body('password')
        .trim()
        .notEmpty()
        .withMessage('Password is required')
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

// Performance validation rules
const performanceValidationRules = [
    body('studentId').notEmpty().withMessage('Student ID is required'),
    body('engagementScore').isFloat({ min: 0, max: 100 }).withMessage('Invalid engagement score'),
    body('date').isISO8601().withMessage('Invalid date format'),
    validate
];

module.exports = {
    validateRegistration,
    validateLogin,
    validateImage,
    validatePerformance,
    validateInstitution,
    validateCurriculum,
    validate,
    performanceValidationRules
}; 