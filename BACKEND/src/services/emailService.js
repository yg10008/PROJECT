const nodemailer = require('nodemailer');
const { logger, logError } = require('../utils/logger');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            // Add timeout and retry options
            tls: {
                rejectUnauthorized: process.env.NODE_ENV === 'production'
            },
            pool: true,
            maxConnections: 5,
            maxMessages: 100
        });

        // Verify connection configuration
        this.verifyConnection();
    }

    async verifyConnection() {
        try {
            await this.transporter.verify();
            logger.info('Email service connection established');
        } catch (error) {
            logError('Email service connection failed:', error);
            throw error;
        }
    }

    async sendEmail(options) {
        try {
            // Add default options
            const emailOptions = {
                from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
                ...options,
                headers: {
                    'X-Priority': options.priority || 'normal',
                    'X-Application': process.env.APP_NAME
                }
            };

            const info = await this.transporter.sendMail(emailOptions);
            logger.info('Email sent successfully', { 
                messageId: info.messageId,
                to: options.to,
                subject: options.subject
            });
            return info;
        } catch (error) {
            logError('Email sending failed:', error);
            throw error;
        }
    }

    async sendVerificationEmail(user, token) {
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
        
        await this.sendEmail({
            to: user.email,
            subject: 'Verify Your Email',
            html: `
                <h1>Welcome to ${process.env.APP_NAME}</h1>
                <p>Hello ${user.name},</p>
                <p>Please verify your email by clicking the link below:</p>
                <a href="${verificationUrl}" style="
                    padding: 10px 20px;
                    background-color: #4CAF50;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                ">Verify Email</a>
                <p>This link will expire in 24 hours.</p>
                <p>If you didn't create an account, please ignore this email.</p>
                <p>Best regards,<br>The ${process.env.APP_NAME} Team</p>
            `,
            priority: 'high'
        });
    }

    async sendPasswordResetEmail(user, token) {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
        
        await this.sendEmail({
            to: user.email,
            subject: 'Password Reset Request',
            html: `
                <h1>Password Reset Request</h1>
                <p>Hello ${user.name},</p>
                <p>Click the link below to reset your password:</p>
                <a href="${resetUrl}" style="
                    padding: 10px 20px;
                    background-color: #2196F3;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                ">Reset Password</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email and ensure your account is secure.</p>
                <p>Best regards,<br>The ${process.env.APP_NAME} Team</p>
            `,
            priority: 'high'
        });
    }

    async sendPerformanceAlert(data) {
        await this.sendEmail({
            to: data.email,
            subject: 'Performance Alert',
            html: `
                <h1>Performance Alert</h1>
                <p>Student: ${data.studentName}</p>
                <p>Score: ${data.score}</p>
                <p>Date: ${new Date(data.date).toLocaleDateString()}</p>
                <p>Class: ${data.className || 'N/A'}</p>
                <p>Institution: ${data.institutionName || 'N/A'}</p>
                <div style="margin: 20px 0;">
                    <h2>Performance Details:</h2>
                    <ul>
                        ${data.details ? Object.entries(data.details).map(([key, value]) => 
                            `<li>${key}: ${value}</li>`
                        ).join('') : ''}
                    </ul>
                </div>
                <p>Please check the dashboard for more details.</p>
                <a href="${process.env.FRONTEND_URL}/dashboard" style="
                    padding: 10px 20px;
                    background-color: #4CAF50;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                ">View Dashboard</a>
            `
        });
    }

    async sendWelcomeEmail(user) {
        await this.sendEmail({
            to: user.email,
            subject: `Welcome to ${process.env.APP_NAME}`,
            html: `
                <h1>Welcome to ${process.env.APP_NAME}!</h1>
                <p>Hello ${user.name},</p>
                <p>Thank you for joining our platform. We're excited to have you on board!</p>
                <p>You can now:</p>
                <ul>
                    <li>Upload and analyze classroom images</li>
                    <li>Track student performance</li>
                    <li>Generate detailed reports</li>
                    <li>And much more!</li>
                </ul>
                <a href="${process.env.FRONTEND_URL}/dashboard" style="
                    padding: 10px 20px;
                    background-color: #4CAF50;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                ">Get Started</a>
                <p>If you have any questions, feel free to contact our support team.</p>
                <p>Best regards,<br>The ${process.env.APP_NAME} Team</p>
            `
        });
    }
}

// Create and export a single instance
const emailService = new EmailService();
module.exports = emailService;