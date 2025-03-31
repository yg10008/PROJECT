const { logError, logActivity } = require('../utils/logger');
const { uploadToImgBB } = require('../utils/imageUpload');
const { analyzeWithClarifai } = require('../utils/clarifaiAnalysis');
const { runPythonAnalysis } = require('../utils/pythonBridge');
const Image = require('../models/Image');

class ImageAnalysisService {
    async processImage(imageBuffer, userId, institutionId) {
        try {
            // Step 1: Upload image to ImgBB
            const imageUrl = await uploadToImgBB(imageBuffer);
            logActivity('Image uploaded to ImgBB', { userId });

            // Step 2: Parallel analysis with Clarifai and Python
            const [clarifaiResults, pythonResults] = await Promise.all([
                this.getClarifaiAnalysis(imageBuffer),
                this.getPythonAnalysis(imageBuffer)
            ]);

            // Step 3: Combine and process results
            const analysisResult = this.combineAnalysisResults(
                clarifaiResults, 
                pythonResults
            );

            // Step 4: Save to database
            const image = await this.saveImageData({
                imageUrl,
                userId,
                institutionId,
                analysisResult
            });

            return image;

        } catch (error) {
            logError('Image analysis pipeline failed', error);
            throw error;
        }
    }

    async getClarifaiAnalysis(imageBuffer) {
        try {
            const result = await analyzeWithClarifai(imageBuffer);
            return {
                engagement: this.calculateEngagement(result),
                attendance: this.calculateAttendance(result),
                activity: this.determineActivity(result),
                safety: this.checkSafety(result)
            };
        } catch (error) {
            logError('Clarifai analysis failed', error);
            throw error;
        }
    }

    async getPythonAnalysis(imageBuffer) {
        try {
            return await runPythonAnalysis(imageBuffer);
        } catch (error) {
            logError('Python analysis failed', error);
            throw error;
        }
    }

    combineAnalysisResults(clarifaiResults, pythonResults) {
        return {
            metrics: {
                engagement: {
                    score: (clarifaiResults.engagement + pythonResults.engagement_score) / 2,
                    confidence: 0.85
                },
                attendance: {
                    present: pythonResults.student_count,
                    confidence: 0.9
                },
                activity: {
                    type: clarifaiResults.activity,
                    confidence: 0.8
                }
            },
            safety: {
                issues: clarifaiResults.safety.issues,
                score: clarifaiResults.safety.score
            },
            recommendations: this.generateRecommendations(clarifaiResults, pythonResults)
        };
    }

    async saveImageData({ imageUrl, userId, institutionId, analysisResult }) {
        const image = new Image({
            imageUrl,
            uploadedBy: userId,
            institution: institutionId,
            analysisResult,
            status: 'completed'
        });

        await image.save();
        logActivity('Image analysis saved to database', { imageId: image._id });
        return image;
    }

    generateRecommendations(clarifaiResults, pythonResults) {
        const recommendations = [];

        // Engagement recommendations
        if (clarifaiResults.engagement < 0.6) {
            recommendations.push({
                type: 'engagement',
                priority: 'high',
                suggestion: 'Consider interactive activities to increase engagement'
            });
        }

        // Attendance recommendations
        if (pythonResults.student_count < expectedCount) {
            recommendations.push({
                type: 'attendance',
                priority: 'medium',
                suggestion: 'Follow up on absent students'
            });
        }

        return recommendations;
    }
}

module.exports = new ImageAnalysisService(); 