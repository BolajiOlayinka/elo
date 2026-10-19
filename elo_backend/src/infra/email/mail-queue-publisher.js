const { mailQueue } = require('../queue/queues');

function sendMail(jobName, data) {
    if (!mailQueue) {
        // eslint-disable-next-line no-console
        console.warn('Email skipped: REDIS_URL is not set');

        return null;
    }

    return mailQueue.add(jobName, data);
}

module.exports = sendMail;
