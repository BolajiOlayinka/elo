const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');

const queues = require('./queues');

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');
const boardRouter = serverAdapter.getRouter();

createBullBoard({
    queues: Object.values(queues).map(queue => new BullMQAdapter(queue)),
    serverAdapter
});

module.exports = boardRouter;
