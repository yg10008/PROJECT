const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validatePerformance } = require('../middleware/validators');
const { Performance } = require('../models/Performance');
const { User } = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../utils/asyncHandler');
const { sendPerformanceAlert } = require('../services/emailService');
const logger = require('../utils/logger');

// Create performance record
router.post('/',
    auth,
    validatePerformance,
    asyncHandler(async (req, res) => {
        const performance = new Performance({
            ...req.body,
            institution: req.user.institution
        });

        await performance.save();

        // Check for low performance and send alerts
        if (performance.overallScore < 50) {
            const student = await User.findById(performance.student)
                .populate('institution', 'name');

            await sendPerformanceAlert({
                studentEmail: student.email,
                studentName: student.name,
                score: performance.overallScore,
                institution: student.institution.name,
                date: performance.date
            });
        }

        logger.logActivity('Performance recorded', {
            userId: req.user._id,
            performanceId: performance._id
        });

        res.status(201).json({
            success: true,
            data: { performance }
        });
    })
); 