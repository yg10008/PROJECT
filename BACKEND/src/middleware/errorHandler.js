const express = require('express');
const router = express.Router();
const multer = require('multer');
const Image = require('../models/Image');
const { auth } = require('../middleware/auth');
const { analyzeClassroomImage } = require('../utils/imageAnalysis');
const { logActivity, logError } = require('../utils/logger');
const logger = require('../utils/logger');

// Configure multer for image upload
const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload an image.'), false);
        }
    }
});

// Upload and analyze image
router.post('/upload', auth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        // Analyze image
        const analysisResult = await analyzeClassroomImage(req.file.buffer);

        // Create image record
        const image = new Image({
            institution: req.user.institution,
            uploadedBy: req.user._id,
            imageUrl: 'temporary_url', // You'll need to implement proper image storage
            analysisResult,
            metadata: {
                fileName: req.file.originalname,
                fileSize: req.file.size,
                mimeType: req.file.mimetype
            },
            status: 'completed'
        });

        await image.save();

        logActivity('Image uploaded and analyzed successfully', req);
        res.status(201).json(image);
    } catch (error) {
        logError(error, req);
        res.status(500).json({ message: 'Error processing image' });
    }
});

// Get all images for an institution
router.get('/', auth, async (req, res) => {
    try {
        const images = await Image.find({ institution: req.user.institution })
            .sort({ createdAt: -1 })
            .populate('uploadedBy', 'name email');
        
        res.json(images);
    } catch (error) {
        logError(error, req);
        res.status(500).json({ message: 'Error fetching images' });
    }
});

// Get single image
router.get('/:id', auth, async (req, res) => {
    try {
        const image = await Image.findOne({
            _id: req.params.id,
            institution: req.user.institution
        }).populate('uploadedBy', 'name email');

        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        res.json(image);
    } catch (error) {
        logError(error, req);
        res.status(500).json({ message: 'Error fetching image' });
    }
});

// Delete image
router.delete('/:id', auth, async (req, res) => {
    try {
        const image = await Image.findOneAndDelete({
            _id: req.params.id,
            institution: req.user.institution
        });

        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        logActivity(`Image deleted: ${image._id}`, req);
        res.json({ message: 'Image deleted successfully' });
    } catch (error) {
        logError(error, req);
        res.status(500).json({ message: 'Error deleting image' });
    }
});

// Custom error class
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

// Main error handling middleware
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log error
    logger.logError('Error occurred:', {
        error: err,
        path: req.path,
        method: req.method,
        body: req.body,
        user: req.user?._id
    });

    // Handle different types of errors
    if (err.name === 'ValidationError') {
        return handleValidationError(err, res);
    }

    if (err.name === 'CastError') {
        return handleCastError(err, res);
    }

    if (err.code === 11000) {
        return handleDuplicateKeyError(err, res);
    }

    if (err.name === 'JsonWebTokenError') {
        return handleJWTError(res);
    }

    if (err.name === 'TokenExpiredError') {
        return handleJWTExpiredError(res);
    }

    // Handle multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'File too large'
        });
    }

    // Production vs Development error response
    if (process.env.NODE_ENV === 'production') {
        // Only send operational errors to client
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                success: false,
                message: err.message
            });
        }
        // For programming or unknown errors, send generic message
        return res.status(500).json({
            success: false,
            message: 'Something went wrong'
        });
    }

    // Development error response with full error details
    return res.status(err.statusCode).json({
        success: false,
        message: err.message,
        error: err,
        stack: err.stack
    });
};

// Helper functions for specific errors
const handleValidationError = (err, res) => {
    const errors = Object.values(err.errors).map(error => error.message);
    return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors
    });
};

const handleCastError = (err, res) => {
    return res.status(400).json({
        success: false,
        message: `Invalid ${err.path}: ${err.value}`
    });
};

const handleDuplicateKeyError = (err, res) => {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
        success: false,
        message: `${field} already exists`
    });
};

const handleJWTError = (res) => {
    return res.status(401).json({
        success: false,
        message: 'Invalid token'
    });
};

const handleJWTExpiredError = (res) => {
    return res.status(401).json({
        success: false,
        message: 'Token expired'
    });
};

module.exports = { router, errorHandler, AppError };