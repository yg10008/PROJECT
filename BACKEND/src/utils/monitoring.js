const { logError, logActivity } = require('./logger');

class AnalysisMonitor {
    constructor() {
        this.analysisStats = {
            total: 0,
            successful: 0,
            failed: 0,
            avgProcessingTime: 0
        };
    }

    async trackAnalysis(analysisPromise) {
        const startTime = Date.now();
        this.analysisStats.total++;

        try {
            const result = await analysisPromise;
            this.analysisStats.successful++;
            this.updateProcessingTime(startTime);
            return result;
        } catch (error) {
            this.analysisStats.failed++;
            this.handleError(error);
            throw error;
        }
    }

    updateProcessingTime(startTime) {
        const processingTime = Date.now() - startTime;
        this.analysisStats.avgProcessingTime = 
            (this.analysisStats.avgProcessingTime * (this.analysisStats.successful - 1) + processingTime) 
            / this.analysisStats.successful;
    }

    handleError(error) {
        logError('Analysis failed', error);
        
        // Alert if error rate is too high
        const errorRate = this.analysisStats.failed / this.analysisStats.total;
        if (errorRate > 0.1) {  // 10% error rate threshold
            this.sendAlert('High error rate detected in image analysis');
        }
    }

    getStats() {
        return {
            ...this.analysisStats,
            errorRate: this.analysisStats.failed / this.analysisStats.total,
            successRate: this.analysisStats.successful / this.analysisStats.total
        };
    }
}

module.exports = new AnalysisMonitor(); 