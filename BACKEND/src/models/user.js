const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/,
            'Please enter a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Don't include password in queries by default
    },
    role: {
        type: String,
        enum: {
            values: ['admin', 'teacher', 'institution'],
            message: '{VALUE} is not a valid role'
        },
        default: 'teacher'
    },
    institution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution'
    },
    profileImage: {
        url: String,
        publicId: String
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    verificationTokenExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    lastLogin: Date,
    loginHistory: [{
        timestamp: Date,
        ip: String,
        userAgent: String,
        location: String
    }],
    preferences: {
        notifications: {
            email: { type: Boolean, default: true },
            push: { type: Boolean, default: true }
        },
        theme: {
            type: String,
            enum: ['light', 'dark'],
            default: 'light'
        },
        language: {
            type: String,
            enum: ['en', 'es', 'fr'],
            default: 'en'
        }
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ institution: 1 });

// Password hashing middleware
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
    return jwt.sign(
        { 
            userId: this._id,
            role: this.role,
            institution: this.institution
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );
};

// Generate verification token
userSchema.methods.generateVerificationToken = function() {
    const token = jwt.sign(
        { userId: this._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
    
    this.verificationToken = token;
    this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
    
    return token;
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function() {
    const obj = this.toObject();
    delete obj.password;
    delete obj.verificationToken;
    delete obj.verificationTokenExpires;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpires;
    return obj;
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