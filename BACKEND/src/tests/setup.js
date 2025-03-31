const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

let mongoServer;

// Setup before tests
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

// Cleanup after tests
afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

// Clear database between tests
afterEach(async () => {
    await mongoose.connection.dropDatabase();
});

// Helper to create test JWT token
const generateTestToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET);
};

module.exports = { generateTestToken }; 