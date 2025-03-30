const express = require('express');
const router = express.Router();
const Performance = require('../models/Performance');
const { auth, checkRole } = require('../middleware/auth');
const { validatePerformanceMetrics } = require('../middleware/validators');
const { logActivity, logError } = require('../utils/logger');

// Get all performance metrics for an institution
router.get('/institution/:institutionId', auth, async (req, res) => {
    try {
        const { startDate, endDate, type } = req.query;
        const query = {
            institution: req.params.institutionId
        };

        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const metrics = await Performance.find(query)
            .populate('imageId')
            .sort({ createdAt: -1 });

        logActivity('Performance metrics retrieved', { institutionId: req.params.institutionId });
        res.json(metrics);
    } catch (error) {
        logError('Error fetching performance metrics', error);
        res.status(500).json({ message: 'Error fetching performance metrics' });
    }
});

// Get warnings for a specific performance record
router.get('/:id/warnings', auth, async (req, res) => {
    try {
        const performance = await Performance.findById(req.params.id);
        if (!performance) {
            return res.status(404).json({ message: 'Performance record not found' });
        }

        const warnings = performance.analysisResult.warnings || [];
        res.json(warnings);
    } catch (error) {
        logError('Error fetching warnings', error);
        res.status(500).json({ message: 'Error fetching warnings' });
    }
});

// Update warning status
router.patch('/:id/warnings/:warningId', auth, async (req, res) => {
    try {
        const { status, resolution } = req.body;
        const performance = await Performance.findById(req.params.id);
        
        if (!performance) {
            return res.status(404).json({ message: 'Performance record not found' });
        }

        const warning = performance.analysisResult.warnings.id(req.params.warningId);
        if (!warning) {
            return res.status(404).json({ message: 'Warning not found' });
        }

        warning.status = status;
        warning.resolution = resolution;
        warning.resolvedAt = Date.now();
        warning.resolvedBy = req.user._id;

        await performance.save();
        
        logActivity('Warning status updated', { 
            performanceId: req.params.id,
            warningId: req.params.warningId
        });
        res.json(warning);
    } catch (error) {
        logError('Error updating warning', error);
        res.status(500).json({ message: 'Error updating warning' });
    }
});

// Get assessment for a performance record
router.get('/:id/assessment', auth, async (req, res) => {
    try {
        const performance = await Performance.findById(req.params.id);
        if (!performance) {
            return res.status(404).json({ message: 'Performance record not found' });
        }

        const assessment = {
            metrics: performance.metrics,
            recommendations: generateRecommendations(performance),
            trends: await calculateTrends(performance.institution, performance.createdAt)
        };

        res.json(assessment);
    } catch (error) {
        logError('Error fetching assessment', error);
        res.status(500).json({ message: 'Error fetching assessment' });
    }
});

// Update performance status
router.patch('/:id/status', auth, async (req, res) => {
    try {
        const { status, notes } = req.body;
        const performance = await Performance.findById(req.params.id);
        
        if (!performance) {
            return res.status(404).json({ message: 'Performance record not found' });
        }

        performance.status = status;
        performance.notes = notes;
        await performance.save();
        
        logActivity('Performance status updated', { 
            performanceId: req.params.id,
            status: status
        });
        res.json(performance);
    } catch (error) {
        logError('Error updating performance status', error);
        res.status(500).json({ message: 'Error updating performance status' });
    }
});

// Get performance metrics with filters
router.get('/', auth, async (req, res) => {
    try {
        const { startDate, endDate, type } = req.query;
        const query = {
            institution: req.user.institution
        };

        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        if (type) {
            query['metrics.activity.type'] = type;
        }

        const metrics = await Performance.find(query)
            .populate('imageId')
            .sort({ createdAt: -1 });

        res.json(metrics);
    } catch (error) {
        logError(error, req);
        res.status(500).json({ message: 'Error fetching performance metrics' });
    }
});

// Get performance summary
router.get('/summary', auth, async (req, res) => {
    try {
        const { period = 'daily' } = req.query;
        
        const metrics = await Performance.aggregate([
            {
                $match: {
                    institution: req.user.institution
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: period === 'daily' ? '%Y-%m-%d' : 
                                    period === 'weekly' ? '%Y-%U' : '%Y-%m',
                            date: '$createdAt'
                        }
                    },
                    avgEngagement: { $avg: '$metrics.engagement.score' },
                    avgAttendance: { $avg: '$metrics.attendance.count' },
                    totalImages: { $sum: 1 },
                    activityTypes: { $addToSet: '$metrics.activity.type' }
                }
            },
            { $sort: { _id: -1 } }
        ]);

        res.json(metrics);
    } catch (error) {
        logError(error, req);
        res.status(500).json({ message: 'Error generating performance summary' });
    }
});

// Add performance metrics
router.post('/', auth, async (req, res) => {
    try {
        const performance = new Performance({
            ...req.body,
            institution: req.user.institution
        });
        await performance.save();

        logActivity('Performance metrics added', req);
        res.status(201).json(performance);
    } catch (error) {
        logError(error, req);
        res.status(500).json({ message: 'Error adding performance metrics' });
    }
});

// Get trends and insights
router.get('/trends', auth, async (req, res) => {
    try {
        const { metric, timeframe } = req.query;
        const now = new Date();
        const startDate = new Date();
        
        switch(timeframe) {
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                startDate.setDate(now.getDate() - 30);
        }

        const trends = await Performance.aggregate([
            {
                $match: {
                    institution: req.user.institution,
                    createdAt: { $gte: startDate, $lte: now }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    value: {
                        $avg: `$metrics.${metric}`
                    }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json(trends);
    } catch (error) {
        logError(error, req);
        res.status(500).json({ message: 'Error fetching performance trends' });
    }
});

module.exports = router; 