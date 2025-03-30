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

const app = express();

// Security middleware
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());
app.use(compression());
app.use(morgan('combined'));

// Routes
const institutionRoutes = require("./routes/institutionRoutes");
const imageRoutes = require("./routes/imageRoutes");
const authRoutes = require("./routes/userRoutes");
const curriculumRoutes = require("./routes/curriculumRoutes");
const performanceRoutes = require("./routes/performanceRoutes");
const logRoutes = require("./routes/logs");
const errorHandler = require('./middleware/errorHandler');

// API Routes
app.use("/api/institutions", institutionRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/curriculum", curriculumRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/logs", logRoutes);

// Health check route
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Error handling
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