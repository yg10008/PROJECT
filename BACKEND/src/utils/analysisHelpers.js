const { logError } = require('./logger');

// Calculate engagement trends
const calculateEngagementTrends = async (performanceData) => {
    try {
        const trends = {
            daily: [],
            weekly: [],
            monthly: []
        };

        // Group performance data by different time periods
        performanceData.forEach(record => {
            const date = new Date(record.createdAt);
            const dayKey = date.toISOString().split('T')[0];
            const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
            const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

            updateTrendData(trends.daily, dayKey, record);
            updateTrendData(trends.weekly, weekKey, record);
            updateTrendData(trends.monthly, monthKey, record);
        });

        return trends;
    } catch (error) {
        logError('Error calculating engagement trends', error);
        throw error;
    }
} 