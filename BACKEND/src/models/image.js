const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    institution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution',
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    analysisResult: {
        basicMetrics: {
            engagementScore: Number,
            flagged: Boolean
        },
        detailedAnalysis: {
            studentCount: Number,
            activityType: String,
            detectedObjects: [String],
            safetyIssues: [String],
            attendance: {
                present: Number,
                total: Number
            }
        }
    },
    metadata: {
        fileName: String,
        fileSize: Number,
        mimeType: String,
        dimensions: {
            width: Number,
            height: Number
        }
    },
    tags: [String],
    status: {
        type: String,
        enum: ['processing', 'completed', 'failed'],
        default: 'processing'
    }
}, {
    timestamps: true
});

// Index for faster queries
imageSchema.index({ institution: 1, createdAt: -1 });
imageSchema.index({ uploadedBy: 1, createdAt: -1 });

const Image = mongoose.model('Image', imageSchema);

module.exports = Image; 