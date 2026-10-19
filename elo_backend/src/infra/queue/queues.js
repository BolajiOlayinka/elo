const { Queue } = require('bullmq');
const redisClient = require('../../config/redis');
const { EMAIL_QUEUE } = require('./constants');

const defaultJobOptions = { removeOnComplete: true, removeOnFail: false };

const mailQueue = redisClient
    ? new Queue(EMAIL_QUEUE, { connection: redisClient, defaultJobOptions })
    : null;

module.exports = { mailQueue };
