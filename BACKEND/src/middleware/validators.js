const { body, param, query, validationResult } = require('express-validator');

// Validation result checker
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    next();
};

// Auth validators
const registerValidator = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    
    body('password')
        .trim()
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/\d/).withMessage('Password must contain a number')
        .matches(/[a-zA-Z]/).withMessage('Password must contain a letter'),
    
    body('role')
        .optional()
        .isIn(['admin', 'teacher', 'institution'])
        .withMessage('Invalid role'),
    
    validate
];

// Image validators
const imageUploadValidator = [
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters'),
    
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array'),
    
    validate
];

// Performance validators
const performanceValidator = [
    body('studentId')
        .notEmpty().withMessage('Student ID is required')
        .isMongoId().withMessage('Invalid student ID'),
    
    body('engagementScore')
        .isFloat({ min: 0, max: 100 })
        .withMessage('Engagement score must be between 0 and 100'),
    
    body('date')
        .optional()
        .isISO8601()
        .withMessage('Invalid date format'),
    
    validate
];

// Institution validators
const institutionValidator = [
    body('name')
        .trim()
        .notEmpty().withMessage('Institution name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    
    body('type')
        .isIn(['school', 'college', 'university', 'training'])
        .withMessage('Invalid institution type'),
    
    body('address')
        .trim()
        .notEmpty().withMessage('Address is required'),
    
    body('contact.email')
        .trim()
        .isEmail().withMessage('Invalid contact email'),
    
    body('contact.phone')
        .trim()
        .matches(/^\+?[\d\s-]+$/)
        .withMessage('Invalid phone number format'),
    
    validate
];

// Curriculum validators
const curriculumValidator = [
    body('name')
        .trim()
        .notEmpty().withMessage('Curriculum name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    
    body('subject')
        .trim()
        .notEmpty().withMessage('Subject is required'),
    
    body('grade')
        .trim()
        .notEmpty().withMessage('Grade is required'),
    
    body('description')
        .trim()
        .notEmpty().withMessage('Description is required')
        .isLength({ max: 1000 })
        .withMessage('Description cannot exceed 1000 characters'),
    
    validate
];

// Query validators
const paginationValidator = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    
    validate
];

module.exports = {
    validate,
    registerValidator,
    imageUploadValidator,
    performanceValidator,
    institutionValidator,
    curriculumValidator,
    paginationValidator
}; 