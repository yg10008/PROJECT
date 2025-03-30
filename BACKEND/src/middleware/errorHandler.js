const express = require('express');
const router = express.Router();
const multer = require('multer');
const Image = require('../models/Image');
const { auth } = require('../middleware/auth');
const { analyzeClassroomImage } = require('../utils/imageAnalysis');
const { logActivity, logError } = require('../utils/logger');

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

const errorHandler = (err, req, res, next) => {
    logError(err, req);

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            message: 'Validation Error',
            errors: Object.values(err.errors).map(error => error.message)
        });
    }

    if (err.name === 'MulterError') {
        return res.status(400).json({
            message: 'File Upload Error',
            error: err.message
        });
    }

    if (err.name === 'CastError') {
        return res.status(400).json({
            message: 'Invalid ID format'
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            message: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            message: 'Token expired'
        });
    }

    // Default error
    res.status(500).json({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};

module.exports = { router, errorHandler };