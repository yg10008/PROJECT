const mongoose = require('mongoose');

const performanceMetricSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['engagement', 'attention', 'participation', 'behavior'],
        required: true
    },
    score: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    details: [{
        indicator: String,
        value: Number,
        weight: Number
    }]
});

const performanceSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    institution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution',
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    metrics: [performanceMetricSchema],
    overallScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    images: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Image'
    }],
    notes: {
        type: String,
        trim: true
    },
    flags: [{
        type: String,
        enum: ['low_engagement', 'disruptive', 'improvement', 'excellent'],
        timestamp: Date,
        resolvedAt: Date,
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    interventions: [{
        type: {
            type: String,
            enum: ['warning', 'parent_contact', 'counseling', 'other']
        },
        date: Date,
        description: String,
        by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        outcome: {
            type: String,
            enum: ['pending', 'successful', 'unsuccessful']
        }
    }],
    trends: {
        weeklyAverage: Number,
        monthlyAverage: Number,
        improvement: Number
    }
}, {
    timestamps: true
});

// Indexes
performanceSchema.index({ student: 1, date: -1 });
performanceSchema.index({ class: 1, date: -1 });
performanceSchema.index({ institution: 1 });
performanceSchema.index({ 'flags.type': 1 });

// Calculate overall score middleware
performanceSchema.pre('save', function(next) {
    if (this.isModified('metrics')) {
        const totalWeight = this.metrics.length;
        this.overallScore = this.metrics.reduce((acc, metric) => 
            acc + metric.score, 0) / totalWeight;
    }
    next();
});

// Methods
performanceSchema.methods.calculateTrends = async function() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [weeklyPerformances, monthlyPerformances] = await Promise.all([
        this.model('Performance').find({
            student: this.student,
            date: { $gte: oneWeekAgo }
        }),
        this.model('Performance').find({
            student: this.student,
            date: { $gte: oneMonthAgo }
        })
    ]);

    this.trends = {
        weeklyAverage: calculateAverage(weeklyPerformances),
        monthlyAverage: calculateAverage(monthlyPerformances),
        improvement: calculateImprovement(monthlyPerformances)
    };

    await this.save();
};

// Helper functions
const calculateAverage = (performances) => {
    return performances.reduce((acc, perf) => 
        acc + perf.overallScore, 0) / performances.length;
};

const calculateImprovement = (performances) => {
    if (performances.length < 2) return 0;
    const sorted = performances.sort((a, b) => a.date - b.date);
    const first = sorted[0].overallScore;
    const last = sorted[sorted.length - 1].overallScore;
    return ((last - first) / first) * 100;
};

const Performance = mongoose.model('Performance', performanceSchema);

module.exports = { Performance }; 