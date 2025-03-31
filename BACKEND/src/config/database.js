const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        logger.logActivity(`MongoDB Connected: ${conn.connection.host}`);

        // Handle database connection errors
        mongoose.connection.on('error', (err) => {
            logger.logError('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.logActivity('MongoDB disconnected');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            try {
                await mongoose.connection.close();
                logger.logActivity('MongoDB connection closed through app termination');
                process.exit(0);
            } catch (err) {
                logger.logError('Error during MongoDB shutdown:', err);
                process.exit(1);
            }
        });

    } catch (error) {
        logger.logError('Database connection failed:', error);
        process.exit(1);
    }
};

module.exports = { connectDB }; 