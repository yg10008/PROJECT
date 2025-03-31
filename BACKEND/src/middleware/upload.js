const multer = require('multer');
const path = require('path');
const { AppError } = require('./errorHandler');

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Allow images only
    if (!file.mimetype.startsWith('image')) {
        return cb(new AppError('Please upload only images', 400), false);
    }

    // Check file size (already handled by limits)
    if (file.size > 5 * 1024 * 1024) {
        return cb(new AppError('Image size should be less than 5MB', 400), false);
    }

    cb(null, true);
};

// Configure multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: fileFilter
});

// Handle multiple upload scenarios
const uploadMiddleware = {
    single: upload.single('image'),
    multiple: upload.array('images', 10),
    fields: upload.fields([
        { name: 'profile', maxCount: 1 },
        { name: 'classroom', maxCount: 10 }
    ])
};

// Error handler for multer
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 5MB'
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    next(err);
};

module.exports = {
    uploadMiddleware,
    handleUploadError
}; 