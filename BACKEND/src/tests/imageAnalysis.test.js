const { describe, it, beforeEach, jest } = require('@jest/globals');
const ImageAnalysisService = require('../services/imageAnalysisService');
const ClarifaiService = require('../utils/clarifaiAnalysis');
const { uploadToImgBB } = require('../utils/imageUpload');

describe('Image Analysis Service', () => {
    let imageAnalysisService;
    const mockImageBuffer = Buffer.from('mock-image');

    beforeEach(() => {
        imageAnalysisService = new ImageAnalysisService();
        jest.clearAllMocks();
    });

    describe('processImage', () => {
        it('should successfully process an image', async () => {
            // Mock dependencies
            const mockImgBBUrl = 'https://imgbb.com/image.jpg';
            const mockClarifaiResults = {
                engagement: 0.8,
                attendance: { count: 20 },
                activity: 'lecture'
            };
            const mockPythonResults = {
                student_count: 22,
                engagement_score: 0.75
            };

            // Setup mocks
            uploadToImgBB.mockResolvedValue(mockImgBBUrl);
            ClarifaiService.analyzeWithClarifai.mockResolvedValue(mockClarifaiResults);

            const result = await imageAnalysisService.processImage(
                mockImageBuffer,
                'user123',
                'inst123'
            );

            expect(result).toHaveProperty('imageUrl', mockImgBBUrl);
            expect(result.analysisResult).toHaveProperty('metrics');
            expect(result.status).toBe('completed');
        });

        it('should handle ImgBB upload failure', async () => {
            uploadToImgBB.mockRejectedValue(new Error('Upload failed'));

            await expect(
                imageAnalysisService.processImage(mockImageBuffer, 'user123', 'inst123')
            ).rejects.toThrow('Image upload failed');
        });
    });

    describe('analyzeWithClarifai', () => {
        it('should return valid analysis results', async () => {
            const mockResponse = {
                outputs: [{
                    data: {
                        concepts: [
                            { name: 'attentive', value: 0.9 },
                            { name: 'engaged', value: 0.8 }
                        ]
                    }
                }]
            };

            ClarifaiService.makeApiCall.mockResolvedValue(mockResponse);

            const result = await ClarifaiService.analyzeWithClarifai(mockImageBuffer);

            expect(result).toHaveProperty('engagement');
            expect(result.engagement).toBeGreaterThan(0);
        });
    });
}); 