const request = require('supertest');
const app = require('../../app');
const fs = require('fs').promises;
const path = require('path');

describe('Image Analysis Integration', () => {
    let authToken;
    let testImagePath;

    beforeAll(async () => {
        // Login and get token
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });
        authToken = loginResponse.body.token;

        // Setup test image
        testImagePath = path.join(__dirname, '../fixtures/test-classroom.jpg');
    });

    it('should successfully analyze an uploaded image', async () => {
        const imageBuffer = await fs.readFile(testImagePath);

        const response = await request(app)
            .post('/api/images/upload')
            .set('Authorization', `Bearer ${authToken}`)
            .attach('image', imageBuffer, 'test-image.jpg');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('analysisResult');
        expect(response.body.analysisResult).toHaveProperty('metrics');
    });

    it('should handle invalid image uploads', async () => {
        const response = await request(app)
            .post('/api/images/upload')
            .set('Authorization', `Bearer ${authToken}`)
            .attach('image', Buffer.from('invalid-image'), 'test.jpg');

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message', 'Invalid image format');
    });
}); 