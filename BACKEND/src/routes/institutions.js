const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const { validateInstitution } = require('../middleware/validators');
const { uploadMiddleware } = require('../middleware/upload');
const { Institution } = require('../models/Institution');
const { User } = require('../models/User');
const { uploadToCloud } = require('../services/cloudStorageService');
const { sendWelcomeEmail } = require('../services/emailService');
const { AppError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../utils/asyncHandler');
const logger = require('../utils/logger');

// Create institution (Admin only)
router.post('/',
    auth,
    adminAuth,
    uploadMiddleware.single('logo'),
    validateInstitution,
    asyncHandler(async (req, res) => {
        // Check for duplicate institution
        const existingInstitution = await Institution.findOne({ name: req.body.name });
        if (existingInstitution) {
            throw new AppError('Institution with this name already exists', 400);
        }

        // Upload logo if provided
        let logoData = {};
        if (req.file) {
            const uploadResult = await uploadToCloud(req.file);
            logoData = {
                url: uploadResult.url,
                publicId: uploadResult.publicId
            };
        }

        // Create institution
        const institution = new Institution({
            ...req.body,
            logo: logoData,
            verificationStatus: {
                isVerified: true,
                verifiedBy: req.user._id,
                verifiedAt: new Date()
            }
        });

        await institution.save();

        // Create admin account for institution
        const adminUser = new User({
            name: req.body.adminName,
            email: req.body.adminEmail,
            password: req.body.adminPassword,
            role: 'institution',
            institution: institution._id,
            isVerified: true
        });

        await adminUser.save();

        // Send welcome email
        await sendWelcomeEmail(adminUser.email, {
            institutionName: institution.name,
            adminName: adminUser.name
        });

        logger.logActivity('Institution created', {
            userId: req.user._id,
            institutionId: institution._id
        });

        res.status(201).json({
            success: true,
            data: { 
                institution,
                admin: adminUser.toJSON()
            }
        });
    })
);

// Get all institutions (Admin only)
router.get('/',
    auth,
    adminAuth,
    asyncHandler(async (req, res) => {
        const { page = 1, limit = 10, status, type } = req.query;

        const query = {};
        if (status) query.status = status;
        if (type) query.type = type;

        const institutions = await Institution.find(query)
            .select('-verificationStatus.documents')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Institution.countDocuments(query);

        res.json({
            success: true,
            data: {
                institutions,
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

// Get institution details
router.get('/:id',
    auth,
    asyncHandler(async (req, res) => {
        const institution = await Institution.findById(req.params.id)
            .select(req.user.role === 'admin' ? '+verificationStatus.documents' : '-verificationStatus.documents');

        if (!institution) {
            throw new AppError('Institution not found', 404);
        }

        // Check authorization
        if (req.user.role !== 'admin' && 
            req.user.institution.toString() !== institution._id.toString()) {
            throw new AppError('Not authorized to view this institution', 403);
        }

        res.json({
            success: true,
            data: { institution }
        });
    })
);

// Update institution
router.patch('/:id',
    auth,
    uploadMiddleware.single('logo'),
    validateInstitution,
    asyncHandler(async (req, res) => {
        // Check authorization
        if (req.user.role !== 'admin' && 
            req.user.institution.toString() !== req.params.id) {
            throw new AppError('Not authorized to update this institution', 403);
        }

        const allowedUpdates = [
            'name', 'type', 'address', 'contact', 'settings'
        ];

        const updates = Object.keys(req.body)
            .filter(key => allowedUpdates.includes(key))
            .reduce((obj, key) => {
                obj[key] = req.body[key];
                return obj;
            }, {});

        // Handle logo update
        if (req.file) {
            const uploadResult = await uploadToCloud(req.file);
            updates.logo = {
                url: uploadResult.url,
                publicId: uploadResult.publicId
            };
        }

        const institution = await Institution.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        if (!institution) {
            throw new AppError('Institution not found', 404);
        }

        logger.logActivity('Institution updated', {
            userId: req.user._id,
            institutionId: institution._id
        });

        res.json({
            success: true,
            data: { institution }
        });
    })
);

// Update institution status (Admin only)
router.patch('/:id/status',
    auth,
    adminAuth,
    asyncHandler(async (req, res) => {
        const { status } = req.body;
        
        if (!['pending', 'active', 'suspended', 'inactive'].includes(status)) {
            throw new AppError('Invalid status', 400);
        }

        const institution = await Institution.findByIdAndUpdate(
            req.params.id,
            { 
                status,
                ...(status === 'active' ? {
                    'verificationStatus.isVerified': true,
                    'verificationStatus.verifiedBy': req.user._id,
                    'verificationStatus.verifiedAt': new Date()
                } : {})
            },
            { new: true }
        );

        if (!institution) {
            throw new AppError('Institution not found', 404);
        }

        logger.logActivity('Institution status updated', {
            userId: req.user._id,
            institutionId: institution._id,
            newStatus: status
        });

        res.json({
            success: true,
            data: { institution }
        });
    })
);

// Get institution statistics
router.get('/:id/stats',
    auth,
    asyncHandler(async (req, res) => {
        // Check authorization
        if (req.user.role !== 'admin' && 
            req.user.institution.toString() !== req.params.id) {
            throw new AppError('Not authorized to view these statistics', 403);
        }

        const stats = await Institution.aggregate([
            { $match: { _id: mongoose.Types.ObjectId(req.params.id) } },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: 'institution',
                    as: 'users'
                }
            },
            {
                $lookup: {
                    from: 'images',
                    localField: '_id',
                    foreignField: 'institution',
                    as: 'images'
                }
            },
            {
                $project: {
                    totalUsers: { $size: '$users' },
                    totalImages: { $size: '$images' },
                    teacherCount: {
                        $size: {
                            $filter: {
                                input: '$users',
                                as: 'user',
                                cond: { $eq: ['$$user.role', 'teacher'] }
                            }
                        }
                    },
                    averageEngagement: {
                        $avg: '$images.analysis.engagementScore'
                    }
                }
            }
        ]);

        res.json({
            success: true,
            data: { stats: stats[0] }
        });
    })
);

module.exports = router; 