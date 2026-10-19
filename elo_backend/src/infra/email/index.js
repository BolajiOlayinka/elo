const redisClient = require('../../config/redis');

if (redisClient) {
    require('./worker');
}

const sendMail = require('./mail-queue-publisher');

module.exports = sendMail;
