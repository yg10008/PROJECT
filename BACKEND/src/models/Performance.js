const mongoose = require('mongoose');

const warningSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['engagement', 'attendance', 'safety', 'behavior'],
        required: true
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved', 'dismissed'],
        default: 'open'
    },
    resolution: String,
    resolvedAt: Date,
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

const performanceSchema = new mongoose.Schema({
    institution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution',
        required: true
    },
    imageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Image',
        required: true
    },
    metrics: {
        engagement: {
            score: Number,
            factors: [{
                name: String,
                value: Number
            }]
        },
        attendance: {
            present: Number,
            total: Number,
            timestamp: Date
        },
        activity: {
            type: String,
            confidence: Number,
            duration: Number
        }
    },
    analysis: {
        strengths: [String],
        weaknesses: [String],
        opportunities: [String]
    },
    warnings: [warningSchema],
    recommendations: [{
        type: String,
        priority: {
            type: String,
            enum: ['low', 'medium', 'high']
        },
        suggestion: String,
        reason: String
    }],
    status: {
        type: String,
        enum: ['pending', 'analyzed', 'reviewed', 'archived'],
        default: 'pending'
    },
    statusNotes: String,
    lastUpdated: Date,
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    tags: [String]
}, {
    timestamps: true
});

// Indexes for better query performance
performanceSchema.index({ institution: 1, createdAt: -1 });
performanceSchema.index({ imageId: 1 });
performanceSchema.index({ 'metrics.engagement.score': 1 });
performanceSchema.index({ status: 1 });

// Virtual for calculating overall performance score
performanceSchema.virtual('overallScore').get(function() {
    const engagementWeight = 0.4;
    const attendanceWeight = 0.3;
    const activityWeight = 0.3;

    const engagementScore = this.metrics.engagement.score;
    const attendanceScore = (this.metrics.attendance.present / this.metrics.attendance.total) * 100;
    const activityScore = this.metrics.activity.confidence;

    return (
        engagementScore * engagementWeight +
        attendanceScore * attendanceWeight +
        activityScore * activityWeight
    );
});

const Performance = mongoose.model('Performance', performanceSchema);
module.exports = Performance; 