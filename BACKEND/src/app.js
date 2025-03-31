require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const { connectDB } = require("./config/database");
const { logger } = require("./utils/logger");
const mongoose = require("mongoose");
const fs = require('fs');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');
const { auth } = require('./middleware/auth');
const { validate } = require('./middleware/validators');

const app = express();

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Security middleware
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use(cookieParser());
app.use(compression());
app.use(morgan('dev'));

// Routes
const institutionRoutes = require("./routes/institutionRoutes");
const imageRoutes = require("./routes/imageRoutes");
const authRoutes = require("./routes/userRoutes");
const curriculumRoutes = require("./routes/curriculumRoutes");
const performanceRoutes = require("./routes/performanceRoutes");
// const logsRouter = require('./routes/logs');  // This line is causing the error

// API Routes
app.use("/api/institutions", institutionRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/curriculum", curriculumRoutes);
app.use("/api/performance", performanceRoutes);
// app.use('/api/logs', logsRouter);

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check route
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Error handler should be the last middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

// MongoDB connection
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("CONNECTION_TO_DATABASE_IS_SUCCESSFULLY_ESTABLISHED");
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("MONGODB_CONNECTION_ERROR:", err);
        process.exit(1);
    });

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error(err, {});
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error(err, {});
    process.exit(1);
});

module.exports = app; 