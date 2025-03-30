const express = require('express');
const router = express.Router();
const Institution = require('../models/Institution');
const { auth, checkRole } = require('../middleware/auth');
const { logActivity, logError } = require('../utils/logger');

// Create new institution (admin only)
router.post('/', auth, checkRole(['admin']), async (req, res) => {
    try {
        const institution = new Institution(req.body);
        await institution.save();
        
        logActivity('Institution created successfully', req);
        res.status(201).json(institution);
    } catch (error) {
        logError(error, req);
        res.status(500).json({ message: 'Error creating institution' });
    }
});

// Get all institutions
router.get('/', auth, async (req, res) => {
    try {
        const institutions = await Institution.find();
        res.json(institutions);
    } catch (error) {
        logError(error, req);
        res.status(500).json({ message: 'Error fetching institutions' });
    }
});

// Get single institution
router.get('/:id', auth, async (req, res) => {
    try {
        const institution = await Institution.findById(req.params.id);
        if (!institution) {
            return res.status(404).json({ message: 'Institution not found' });
        }
        res.json(institution);
    } catch (error) {
        logError(error, req);
        res.status(500).json({ message: 'Error fetching institution' });
    }
});

// Update institution
router.patch('/:id', auth, checkRole(['admin', 'institution_admin']), async (req, res) => {
    try {
        const institution = await Institution.findById(req.params.id);
        if (!institution) {
            return res.status(404).json({ message: 'Institution not found' });
        }

        Object.assign(institution, req.body);
        await institution.save();

        logActivity(`Institution updated: ${institution._id}`, req);
        res.json(institution);
    } catch (error) {
        logError(error, req);
        res.status(500).json({ message: 'Error updating institution' });
    }
});

// Delete institution (admin only)
router.delete('/:id', auth, checkRole(['admin']), async (req, res) => {
    try {
        const institution = await Institution.findByIdAndDelete(req.params.id);
        if (!institution) {
            return res.status(404).json({ message: 'Institution not found' });
        }

        logActivity(`Institution deleted: ${institution._id}`, req);
        res.json({ message: 'Institution deleted successfully' });
    } catch (error) {
        logError(error, req);
        res.status(500).json({ message: 'Error deleting institution' });
    }
});

module.exports = router;