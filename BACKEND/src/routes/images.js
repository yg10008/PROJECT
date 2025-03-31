const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { uploadMiddleware, handleUploadError } = require('../middleware/upload');
const { validateImageUpload } = require('../middleware/validators');
const { Image } = require('../models/Image');
const { analyzeImage } = require('../services/imageAnalysisService');
const { uploadToCloud } = require('../services/cloudStorageService');
const { AppError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../utils/asyncHandler');
const logger = require('../utils/logger');

// Upload and analyze image
router.post('/upload', 
    auth,
    uploadMiddleware.single('image'),
    handleUploadError,
    validateImageUpload,
    asyncHandler(async (req, res) => {
        if (!req.file) {
            throw new AppError('No image file provided', 400);
        }

        // Upload to cloud storage
        const cloudUpload = await uploadToCloud(req.file);

        // Create image record
        const image = new Image({
            url: cloudUpload.url,
            publicId: cloudUpload.publicId,
            institution: req.user.institution,
            uploadedBy: req.user._id,
            class: req.body.classId,
            subject: req.body.subject,
            grade: req.body.grade,
            description: req.body.description,
            tags: req.body.tags?.split(',').map(tag => tag.trim())
        });

        // Analyze image
        const analysis = await analyzeImage(req.file.buffer);
        image.analysis = analysis;
        image.status = 'analyzed';
        image.processingTime = Date.now() - req.file.timestamp;

        await image.save();

        // Log activity
        logger.logActivity('Image uploaded and analyzed', {
            userId: req.user._id,
            imageId: image._id
        });

        res.status(201).json({
            success: true,
            data: { image }
        });
    })
);

// Get images for institution
router.get('/',
    auth,
    asyncHandler(async (req, res) => {
        const { page = 1, limit = 10, status, startDate, endDate } = req.query;

        const query = {
            institution: req.user.institution
        };

        if (status) query.status = status;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const images = await Image.find(query)
            .populate('uploadedBy', 'name')
            .populate('class', 'name')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Image.countDocuments(query);

        res.json({
            success: true,
            data: {
                images,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    })
);

// Get specific image
router.get('/:id',
    auth,
    asyncHandler(async (req, res) => {
        const image = await Image.findOne({
            _id: req.params.id,
            institution: req.user.institution
        })
        .populate('uploadedBy', 'name')
        .populate('class', 'name');

        if (!image) {
            throw new AppError('Image not found', 404);
        }

        res.json({
            success: true,
            data: { image }
        });
    })
);

// Update image details
router.patch('/:id',
    auth,
    asyncHandler(async (req, res) => {
        const allowedUpdates = ['description', 'tags', 'privacy'];
        const updates = Object.keys(req.body)
            .filter(key => allowedUpdates.includes(key))
            .reduce((obj, key) => {
                obj[key] = req.body[key];
                return obj;
            }, {});

        const image = await Image.findOneAndUpdate(
            {
                _id: req.params.id,
                institution: req.user.institution
            },
            updates,
            { new: true, runValidators: true }
        );

        if (!image) {
            throw new AppError('Image not found', 404);
        }

        res.json({
            success: true,
            data: { image }
        });
    })
);

// Delete image
router.delete('/:id',
    auth,
    asyncHandler(async (req, res) => {
        const image = await Image.findOne({
            _id: req.params.id,
            institution: req.user.institution
        });

        if (!image) {
            throw new AppError('Image not found', 404);
        }

        // Delete from cloud storage
        await deleteFromCloud(image.publicId);

        await image.remove();

        res.json({
            success: true,
            message: 'Image deleted successfully'
        });
    })
);

module.exports = router; 