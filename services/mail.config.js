const transporter = require('../configs/mail.config');
const magicLinkTemplate = require('../templates/onboard.link.template');
const welcomeTemplate = require('../templates/welcome.template');
const verificationTemplate = require('../templates/verification.template');
const passwordResetTemplate = require('../templates/password.reset.template');

const sendMagicLinkEmail = async (email, magicLink, name) => {
    try {
        const mailOptions = {
            from: `"${process.env.SMTP_FROM_NAME || 'Docs Clone'}" <${process.env.SMTP_FROM_EMAIL}>`,
            to: email,
            subject: 'Your Magic Link - Sign In to Docs Clone',
            html: magicLinkTemplate(name, magicLink)
        };

        const info = await transporter.sendMail(mailOptions);
        return info;
    } catch (error) {
        throw error;
    }
};

const sendWelcomeEmail = async (email, name) => {
    try {
        const mailOptions = {
            from: `"${process.env.SMTP_FROM_NAME || 'Docs Clone'}" <${process.env.SMTP_FROM_EMAIL}>`,
            to: email,
            subject: 'Welcome to Docs Clone!',
            html: welcomeTemplate(name)
        };

        const info = await transporter.sendMail(mailOptions);
        return info;
    } catch (error) {
        throw error;
    }
};

const sendVerificationEmail = async (email, verificationLink, name) => {
    try {
        const mailOptions = {
            from: `"${process.env.SMTP_FROM_NAME || 'Docs Clone'}" <${process.env.SMTP_FROM_EMAIL}>`,
            to: email,
            subject: 'Verify Your Email - Docs Clone',
            html: verificationTemplate(name, verificationLink)
        };

        const info = await transporter.sendMail(mailOptions);
        return info;
    } catch (error) {
        throw error;
    }
};

const sendPasswordResetEmail = async (email, resetLink, name) => {
    try {
        const mailOptions = {
            from: `"${process.env.SMTP_FROM_NAME || 'Docs Clone'}" <${process.env.SMTP_FROM_EMAIL}>`,
            to: email,
            subject: 'Reset Your Password - Docs Clone',
            html: passwordResetTemplate(name, resetLink)
        };

        const info = await transporter.sendMail(mailOptions);
        return info;
    } catch (error) {
        throw error;
    }
};

const sendEmail = async (to, subject, html, text) => {
    try {
        const mailOptions = {
            from: `"${process.env.SMTP_FROM_NAME || 'Docs Clone'}" <${process.env.SMTP_FROM_EMAIL}>`,
            to,
            subject,
            html,
            text
        };

        const info = await transporter.sendMail(mailOptions);
        return info;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    sendMagicLinkEmail,
    sendWelcomeEmail,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendEmail
};