const { mailQueue } = require('../queue/queues');

function sendMail(n, data) {
    mailQueue.add(n, data);
}

module.exports = sendMail;
