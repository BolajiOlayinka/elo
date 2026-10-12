const sendMail = require('../../../infra/email');
const ejs = require('ejs');
const env = require('../../../config/env');
const path = require('path');

class EmailService {
    static async sendEmailVerificationMail(toEmail, toName, verificationCode) {
        setImmediate(async () => {
            const subject = 'Verify your email address';
            const template = await this.getTemplate('email-verification', {
                VERIFICATION_CODE: verificationCode,
                EMAIL_SUBJECT: subject
            });
            sendMail('email-verification', {
                toName,
                toEmail,
                fromName: env.FROM_NAME,
                fromEmail: env.FROM_EMAIL,
                subject,
                html: template
            });
        });
    }

    static async sendWelcomeMail(toEmail, toName) {
        setImmediate(async () => {
            const subject = 'Welcome to Estodus Secure Lift!';
            const template = await this.getTemplate('welcome-email', {
                EMAIL_SUBJECT: subject
            });
            sendMail('welcome-email', {
                toName,
                toEmail,
                fromName: env.FROM_NAME,
                fromEmail: env.FROM_EMAIL,
                subject,
                html: template
            });
        });
    }

    static async sendForgotPasswordMail(toEmail, toName, resetToken) {
        setImmediate(async () => {
            const subject = 'Reset your password';
            const template = await this.getTemplate('forgot-password', {
                RESET_TOKEN: resetToken,
                EMAIL_SUBJECT: subject
            });
            sendMail('forgot-password', {
                toName,
                toEmail,
                fromName: env.FROM_NAME,
                fromEmail: env.FROM_EMAIL,
                subject,
                html: template
            });
        });
    }

    static async sendPasswordResetMail(toEmail, toName) {
        setImmediate(async () => {
            const subject = 'Password reset successful';
            const template = await this.getTemplate('password-reset', {
                EMAIL_SUBJECT: subject
            });
            sendMail('password-reset', {
                toName,
                toEmail,
                fromName: env.FROM_NAME,
                fromEmail: env.FROM_EMAIL,
                subject,
                html: template
            });
        });
    }

    static async getTemplate(templateName, options) {
        return await ejs.renderFile(path.join(__dirname, `templates/${templateName}.ejs`), options);
    }
};

module.exports = EmailService;
