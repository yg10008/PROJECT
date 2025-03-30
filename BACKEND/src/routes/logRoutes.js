const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const { logActivity, logError } = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

// Get all logs
router.get('/', auth, checkRole(['admin']), async (req, res) => {
    try {
        const { type = 'activity', date, limit = 100 } = req.query;
        const logDir = path.join(__dirname, '../../logs');
        
        let filename = date ? 
            `${type}-${date}.log` : 
            `${type}-${new Date().toISOString().split('T')[0]}.log`;

        const logPath = path.join(logDir, filename);
        const logs = await fs.readFile(logPath, 'utf8');
        
        const logEntries = logs
            .split('\n')
            .filter(Boolean)
            .map(line => JSON.parse(line))
            .slice(-limit);

        logActivity('Logs accessed', { type, date });
        res.json(logEntries);
    } catch (error) {
        logError('Error fetching logs', error);
        res.status(500).json({ message: 'Error fetching logs' });
    }
});

// Get error statistics
router.get('/errors/stats', auth, checkRole(['admin']), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const stats = await calculateErrorStats(startDate, endDate);
        
        logActivity('Error stats accessed');
        res.json(stats);
    } catch (error) {
        logError('Error fetching error stats', error);
        res.status(500).json({ message: 'Error fetching error statistics' });
    }
});

// Get activity summary
router.get('/activity/summary', auth, checkRole(['admin']), async (req, res) => {
    try {
        const { period = 'daily' } = req.query;
        const summary = await calculateActivitySummary(period);
        
        logActivity('Activity summary accessed');
        res.json(summary);
    } catch (error) {
        logError('Error fetching activity summary', error);
        res.status(500).json({ message: 'Error fetching activity summary' });
    }
});

async function calculateErrorStats(startDate, endDate) {
    // Implementation for calculating error statistics
    // This would analyze error logs and return statistics
}

async function calculateActivitySummary(period) {
    // Implementation for calculating activity summary
    // This would analyze activity logs and return summary data
}

module.exports = router; 