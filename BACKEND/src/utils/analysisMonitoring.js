class AnalysisMonitor {
    constructor() {
        this.metrics = {
            totalRequests: 0,
            successfulAnalyses: 0,
            failedAnalyses: 0,
            averageProcessingTime: 0,
            errorRates: new Map()
        };
    }

    trackAnalysis(startTime) {
        this.metrics.totalRequests++;
        const processingTime = Date.now() - startTime;
        this.metrics.averageProcessingTime = (this.metrics.averageProcessingTime * 0.9 + processingTime * 0.1);
    }
} 