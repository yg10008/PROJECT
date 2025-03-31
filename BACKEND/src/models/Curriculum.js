const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    duration: {
        type: Number, // in minutes
        required: true
    },
    objectives: [{
        type: String,
        required: true
    }],
    resources: [{
        type: {
            type: String,
            enum: ['document', 'video', 'link', 'other'],
            required: true
        },
        title: String,
        url: String,
        description: String
    }]
});

const curriculumSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    institution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution',
        required: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    grade: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    lessons: [lessonSchema],
    status: {
        type: String,
        enum: ['draft', 'active', 'archived'],
        default: 'draft'
    },
    academicYear: {
        type: String,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Add indexes for common queries
curriculumSchema.index({ institution: 1, subject: 1, grade: 1 });
curriculumSchema.index({ status: 1 });

const Curriculum = mongoose.model('Curriculum', curriculumSchema);

module.exports = { Curriculum }; 