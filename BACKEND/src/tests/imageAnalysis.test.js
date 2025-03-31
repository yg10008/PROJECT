const { describe, it, beforeEach, jest } = require('@jest/globals');
const ImageAnalysisService = require('../services/imageAnalysisService');
const ClarifaiService = require('../utils/clarifaiAnalysis');
const { uploadToImgBB } = require('../utils/imageUpload');
const request = require('supertest');
const app = require('../app');
const { User } = require('../models/User');
const { generateTestToken } = require('./setup');
const path = require('path');

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

describe('Image Analysis API', () => {
    let token;
    let user;

    beforeEach(async () => {
        user = await User.create({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            role: 'teacher'
        });
        token = generateTestToken(user._id);
    });

    describe('POST /api/images/upload', () => {
        it('should upload and analyze image', async () => {
            const res = await request(app)
                .post('/api/images/upload')
                .set('Authorization', `Bearer ${token}`)
                .attach('image', path.join(__dirname, 'fixtures/test-image.jpg'));

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.analysis).toBeDefined();
        });

        it('should reject invalid file type', async () => {
            const res = await request(app)
                .post('/api/images/upload')
                .set('Authorization', `Bearer ${token}`)
                .attach('image', path.join(__dirname, 'fixtures/test.txt'));

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });
}); 