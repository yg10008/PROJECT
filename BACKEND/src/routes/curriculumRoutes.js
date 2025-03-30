const express = require('express');
const router = express.Router();
const Curriculum = require('../models/Curriculum');
const { auth, checkRole } = require('../middleware/auth');
const { logActivity, logError } = require('../utils/logger');

// Create curriculum
router.post('/', auth, checkRole(['admin', 'institution_admin']), async (req, res) => {
    try {
        const curriculum = new Curriculum({
            ...req.body,
            institution: req.user.institution,
            createdBy: req.user._id
        });
        await curriculum.save();

        logActivity('Curriculum created', req);
        res.status(201).json(curriculum);
    } catch (error) {
        logError(error, req);
        res.status(500).json({ message: 'Error creating curriculum' });
    }
});

// Get all curricula
router.get('/', auth, async (req, res) => {
    try {
        const { status, subject } = req.query;
        const query = { 
            institution: req.user.institution 
        };

        if (status) query.status = status;
        if (subject) query['subjects.name'] = subject;

        const curricula = await Curriculum.find(query)
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(curricula);
    } catch (error) {
        logError(error, req);
        res.status(500).json({ message: 'Error fetching curricula' });
    }
});

// Get single curriculum
router.get('/:id', auth, async (req, res) => {
    try {
        const curriculum = await Curriculum.findOne({
            _id: req.params.id,
            institution: req.user.institution
        }).populate('createdBy', 'name email');

        if (!curriculum) {
            return res.status(404).json({ message: 'Curriculum not found' });
        }

        res.json(curriculum);
    } catch (error) {
        logError(error, req);
        res.status(500).json({ message: 'Error fetching curriculum' });
    }
});

// Update curriculum
router.patch('/:id', auth, checkRole(['admin', 'institution_admin']), async (req, res) => {
    try {
        const curriculum = await Curriculum.findOneAndUpdate(
            {
                _id: req.params.id,
                institution: req.user.institution
            },
            {
                ...req.body,
                lastUpdated: Date.now()
            },
            { new: true }
        );

        if (!curriculum) {
            return res.status(404).json({ message: 'Curriculum not found' });
        }

        logActivity(`Curriculum updated: ${curriculum._id}`, req);
        res.json(curriculum);
    } catch (error) {
        logError(error, req);
        res.status(500).json({ message: 'Error updating curriculum' });
    }
});

// Delete curriculum
router.delete('/:id', auth, checkRole(['admin', 'institution_admin']), async (req, res) => {
    try {
        const curriculum = await Curriculum.findOneAndDelete({
            _id: req.params.id,
            institution: req.user.institution
        });

        if (!curriculum) {
            return res.status(404).json({ message: 'Curriculum not found' });
        }

        logActivity(`Curriculum deleted: ${curriculum._id}`, req);
        res.json({ message: 'Curriculum deleted successfully' });
    } catch (error) {
        logError(error, req);
        res.status(500).json({ message: 'Error deleting curriculum' });
    }
});

module.exports = router; 