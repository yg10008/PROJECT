const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { Curriculum } = require('../models/Curriculum');
const logger = require('../utils/logger');

// Get all curricula for an institution
router.get('/', auth, async (req, res) => {
    try {
        const curricula = await Curriculum.find({ 
            institution: req.user.institution 
        })
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: { curricula }
        });
    } catch (error) {
        logger.logError('Fetch curricula error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching curricula'
        });
    }
});

// Create new curriculum
router.post('/', auth, async (req, res) => {
    try {
        const curriculum = new Curriculum({
            ...req.body,
            institution: req.user.institution,
            createdBy: req.user._id,
            lastUpdatedBy: req.user._id
        });

        await curriculum.save();

        res.status(201).json({
            success: true,
            data: { curriculum }
        });
    } catch (error) {
        logger.logError('Create curriculum error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating curriculum'
        });
    }
});

// Update curriculum
router.put('/:id', auth, async (req, res) => {
    try {
        const curriculum = await Curriculum.findOneAndUpdate(
            { 
                _id: req.params.id,
                institution: req.user.institution
            },
            { 
                ...req.body,
                lastUpdatedBy: req.user._id
            },
            { new: true }
        );

        if (!curriculum) {
            return res.status(404).json({
                success: false,
                message: 'Curriculum not found'
            });
        }

        res.json({
            success: true,
            data: { curriculum }
        });
    } catch (error) {
        logger.logError('Update curriculum error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating curriculum'
        });
    }
});

// Delete curriculum
router.delete('/:id', auth, async (req, res) => {
    try {
        const curriculum = await Curriculum.findOneAndDelete({
            _id: req.params.id,
            institution: req.user.institution
        });

        if (!curriculum) {
            return res.status(404).json({
                success: false,
                message: 'Curriculum not found'
            });
        }

        res.json({
            success: true,
            message: 'Curriculum deleted successfully'
        });
    } catch (error) {
        logger.logError('Delete curriculum error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting curriculum'
        });
    }
});

module.exports = router;
