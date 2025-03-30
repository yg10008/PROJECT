const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String
    },
    contactInfo: {
        email: String,
        phone: String,
        website: String
    },
    type: {
        type: String,
        enum: ['school', 'college', 'university', 'training_center'],
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'pending'],
        default: 'pending'
    },
    subscription: {
        plan: {
            type: String,
            enum: ['free', 'basic', 'premium'],
            default: 'free'
        },
        startDate: Date,
        endDate: Date
    },
    settings: {
        maxUsers: {
            type: Number,
            default: 5
        },
        maxStorage: {
            type: Number,
            default: 1000 // in MB
        },
        features: [{
            type: String,
            enum: ['image_analysis', 'performance_metrics', 'curriculum_management']
        }]
    }
}, {
    timestamps: true
});

const Institution = mongoose.model('Institution', institutionSchema);

module.exports = Institution; 