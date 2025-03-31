const ClarifaiStub = require('clarifai-nodejs-grpc').grpc;
const { logError } = require('./logger');

class ClarifaiService {
    constructor() {
        this.stub = ClarifaiStub.json();
        this.validateConfig();
    }

    validateConfig() {
        const requiredEnvVars = [
            'CLARIFAI_API_KEY',
            'CLARIFAI_USER_ID',
            'CLARIFAI_APP_ID'
        ];

        requiredEnvVars.forEach(varName => {
            if (!process.env[varName]) {
                throw new Error(`Missing required environment variable: ${varName}`);
            }
        });
    }

    async analyzeWithClarifai(imageBuffer) {
        try {
            const imageBase64 = imageBuffer.toString('base64');
            
            const response = await this.makeApiCall(imageBase64);
            return this.processResponse(response);

        } catch (error) {
            logError('Clarifai analysis failed', error);
            throw new Error('Failed to analyze image with Clarifai');
        }
    }

    makeApiCall(imageBase64) {
        return new Promise((resolve, reject) => {
            this.stub.PostModelOutputs(
                {
                    user_app_id: {
                        user_id: process.env.CLARIFAI_USER_ID,
                        app_id: process.env.CLARIFAI_APP_ID
                    },
                    model_id: 'classroom-analysis-model',
                    inputs: [{
                        data: {
                            image: { base64: imageBase64 }
                        }
                    }]
                },
                process.env.CLARIFAI_API_KEY,
                (err, response) => {
                    if (err) reject(err);
                    else resolve(response);
                }
            );
        });
    }

    processResponse(response) {
        if (!response.outputs || !response.outputs[0]) {
            throw new Error('Invalid response from Clarifai');
        }

        const concepts = response.outputs[0].data.concepts;
        return {
            engagement: this.calculateEngagement(concepts),
            activity: this.determineActivity(concepts),
            safety: this.assessSafety(concepts)
        };
    }

    calculateEngagement(concepts) {
        const engagementIndicators = [
            'attentive',
            'engaged',
            'participating',
            'focused'
        ];

        return concepts
            .filter(c => engagementIndicators.includes(c.name))
            .reduce((acc, curr) => acc + curr.value, 0) / engagementIndicators.length;
    }

    determineActivity(concepts) {
        const activities = {
            lecture: ['whiteboard', 'presentation', 'teaching'],
            group_work: ['discussion', 'collaboration', 'group'],
            individual_work: ['reading', 'writing', 'studying']
        };

        let maxScore = 0;
        let detectedActivity = 'unknown';

        for (const [activity, indicators] of Object.entries(activities)) {
            const score = concepts
                .filter(c => indicators.includes(c.name))
                .reduce((acc, curr) => acc + curr.value, 0);

            if (score > maxScore) {
                maxScore = score;
                detectedActivity = activity;
            }
        }

        return {
            type: detectedActivity,
            confidence: maxScore / indicators.length
        };
    }

    assessSafety(concepts) {
        const safetyIssues = [
            'overcrowding',
            'obstruction',
            'hazard',
            'unsafe'
        ];

        const issues = concepts
            .filter(c => safetyIssues.includes(c.name))
            .map(c => ({
                type: c.name,
                confidence: c.value
            }));

        return {
            issues,
            score: 1 - (issues.length > 0 ? 
                issues.reduce((acc, curr) => acc + curr.confidence, 0) / issues.length : 0)
        };
    }
}

module.exports = new ClarifaiService(); 