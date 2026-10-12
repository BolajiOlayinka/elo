const nodemailer = require('nodemailer');
const env = require('../../config/env');

let transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
    }
});

if (env.USE_GMAIL) {
    transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: env.GMAIL_USER,
            pass: env.GMAIL_PASS
        }
    });
}

async function send(details) {
    await transporter.sendMail({
        from: {
            name: details.fromName,
            address: details.fromEmail
        },
        to: [{
            name: details.toName,
            address: env.USE_GMAIL ? env.FROM_EMAIL : details.toEmail
        }],
        attachments: details.attachments,
        subject: details.subject,
        text: details.text,
        html: details.html
    });
}

module.exports = { send };
