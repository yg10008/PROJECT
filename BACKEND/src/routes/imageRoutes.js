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
        const { startDate, endDate } = req.query;
        const query = { institution: req.user.institution };

        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const images = await Image.find(query)
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

        // Here you would also delete the actual image file from storage

        logActivity(`Image deleted: ${image._id}`, req);
        res.json({ message: 'Image deleted successfully' });
    } catch (error) {
        logError(error, req);
        res.status(500).json({ message: 'Error deleting image' });
    }
});

module.exports = router;