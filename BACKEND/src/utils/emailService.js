const nodemailer = require('nodemailer');
const { logError, logActivity } = require('./logger');

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Verify email template
const getVerificationEmailTemplate = (name, verificationToken) => {
    return `
        <h1>Welcome to Classroom Analytics!</h1>
        <p>Hello ${name},</p>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}">
            Verify Email Address
        </a>
        <p>This link will expire in 24 hours.</p>
    `;
};

const sendVerificationEmail = async (user, verificationToken) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: user.email,
            subject: 'Verify Your Email - Classroom Analytics',
            html: getVerificationEmailTemplate(user.name, verificationToken)
        });

        logActivity('Verification email sent', { userId: user._id });
    } catch (error) {
        logError('Email sending failed', error);
        throw new Error('Failed to send verification email');
    }
};

module.exports = {
    sendVerificationEmail
}; 