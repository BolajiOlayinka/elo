const { Queue } = require('bullmq');
const redisClient = require('../../config/redis');
const { EMAIL_QUEUE } = require('./constants');

const defaultJobOptions = { removeOnComplete: true, removeOnFail: false };

// Create BullMQ queue for mailing
const mailQueue = new Queue(EMAIL_QUEUE, { connection: redisClient, defaultJobOptions });

module.exports = { mailQueue };
