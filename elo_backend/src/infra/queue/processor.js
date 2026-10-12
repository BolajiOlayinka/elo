/* eslint-disable no-console */

// TODO: Replace console logs with logger

const { Worker: BullMQWorker } = require('bullmq');
const redisClient = require('../../config/redis');

/**
 * Sets up a BullMQ worker for a queue.
 *
 * @template T - Return type of the processor function
 * @template K - Type of the job data
 * @param {string} queueName
 * @param {(data: K) => Promise<T>} processor
 * @param {WorkerOptions} options
 * @returns {BullMQWorker}
 */
async function setupQueueProcessor(queueName, processor, options = {}) {
    const worker = new BullMQWorker(
        queueName,
        async (job) => {
            const response = await processor(job.data);
            
            return response;
        },
        { connection: redisClient, ...options }
    );

    worker.on('completed', job => console.log(`Job ${job.id} completed`));
    worker.on('failed', (job, err) => console.error(`Job ${job.id} failed:`, err));
    worker.on('error', err => console.error('Worker error:', err));

    return worker;
}

module.exports = setupQueueProcessor;
