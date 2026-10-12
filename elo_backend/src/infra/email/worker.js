const { EMAIL_QUEUE } = require('../queue/constants');
const setupQueueProcessor = require('../queue/processor');
const sendMail = require('./processor');

setupQueueProcessor(EMAIL_QUEUE, sendMail);
