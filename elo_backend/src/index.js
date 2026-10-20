const { app } = require('./app');
const http = require('http');
const env = require('./config/env');

const server = http.createServer(app);

if (env.NODE_ENV === 'development') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
}

const port = env.PORT;

server.listen(port, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on http://localhost:${port}`);
    if (env.DATABASE_URL) {
        const databaseHost = new URL(env.DATABASE_URL).hostname;

        // eslint-disable-next-line no-console
        console.log(`Database   ==> ${databaseHost}`);
    }
    // eslint-disable-next-line no-console
    console.log(`Admin UI  ==> http://localhost:${port}/admin/`);
    if (env.NODE_ENV === 'development' && env.REDIS_URL) {
        // eslint-disable-next-line no-console
        console.log(`Queue UI ==> http://localhost:${port}/admin/queues`);
    }
});

module.exports = { server };
