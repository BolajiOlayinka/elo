const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const errorHandler = require('./shared/middleware/error-handler');
const { mountAdmin, mountWeb } = require('./web/static');

const app = express();

app.set('trust proxy', 1);
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'Accept'],
    methods: ['PUT', 'POST', 'DELETE', 'GET', 'PATCH', 'HEAD', 'OPTIONS'],
    origin(request_origin, cb) {
        if (!request_origin || !env.WHITELISTED_ORIGINS) {
            cb(null, true);

            return;
        }

        const allowed_origins = env.WHITELISTED_ORIGINS.split(',').map((item) => item.toLowerCase());
        const origin_allowed = allowed_origins.includes(request_origin.toLowerCase());
        cb(null, origin_allowed);
    }
}));

app.get('/api/health', (req, res) => {
    res.json({
        error: false,
        service: 'elo-points',
        web: true
    });
});

if (env.REDIS_URL) {
    const v1Router = require('./modules/router/v1.router');
    const bullBoardRouter = require('./infra/queue/bull-board');

    app.use('/api/v1', v1Router);
    app.use('/admin/queues', bullBoardRouter);
} else {
    app.use('/api/v1', (req, res) => {
        res.status(503).json({
            error: true,
            message: 'API is not configured on this dyno (REDIS_URL missing). The web app is still served.'
        });
    });
}

mountAdmin(app);
mountWeb(app);

app.use(errorHandler);

module.exports = { app };
