const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['admin', 'teacher', 'institution'],
        default: 'teacher'
    },
    tokens: [{
        type: String
    }],
    lastLogin: {
        type: Date
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    institution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    loginHistory: [{
        timestamp: Date,
        ip: String,
        userAgent: String
    }],
    preferences: {
        notifications: {
            email: { type: Boolean, default: true },
            push: { type: Boolean, default: true }
        },
        dashboard: {
            defaultView: {
                type: String,
                enum: ['summary', 'detailed', 'compact'],
                default: 'summary'
            },
            widgets: [String]
        }
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 10);
    }
    next();
});

// Generate auth token
userSchema.methods.generateAuthToken = async function() {
    const user = this;
    const token = jwt.sign(
        { userId: user._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
    
    user.tokens.push(token);
    await user.save();
    
    return token;
};

// Check if token is valid
userSchema.methods.isTokenValid = function(token) {
    return this.tokens.includes(token);
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    delete user.tokens;
    return user;
};

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Update login history
userSchema.methods.updateLoginHistory = function(ip, userAgent) {
    this.lastLogin = new Date();
    this.loginHistory.push({
        timestamp: new Date(),
        ip,
        userAgent
    });
    
    // Keep only last 10 login records
    if (this.loginHistory.length > 10) {
        this.loginHistory = this.loginHistory.slice(-10);
    }
};

const User = mongoose.model('User', userSchema);

module.exports = { User }; 