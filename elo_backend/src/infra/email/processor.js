const transporter = require('./transporter');

/**
 * Sends an email using the provided mail details.
 *
 * @async
 * @param {Object} details - Email configuration object.
 * @param {string} details.toName - Recipient name.
 * @param {string} details.toEmail - Recipient email address.
 * @param {string} details.subject - Email subject line.
 * @param {string} [details.text] - Plain text email body (optional).
 * @param {string} details.html - HTML email body (optional).
 * @param {string} details.fromName - Sender email address (optional).
 * @param {string} details.fromEmail - Sender email address (optional).
 * @param {Array<string>} [details.cc] - CC recipients (optional).
 * @param {Array<string>} [details.bcc] - BCC recipients (optional).
 * @param {Array<Object>} [details.attachments] - File attachments (optional).
 *
 * @returns {Promise<boolean>} Resolves to true if the email was sent successfully.
 *
 * @throws {Error} Throws an error if sending the email fails.
 */
async function sendMail(details) {
    try {
        const info = await transporter.send(details);
        
        return info;
    } catch (error) {
        // TODO: Remove console.error, replace with logger
        // eslint-disable-next-line no-console
        console.error('Mail sending failed:', error);
        throw error;
    }
}

module.exports = sendMail;
