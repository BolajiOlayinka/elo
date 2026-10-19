const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const env = require('./config/env');
const errorHandler = require('./shared/middleware/error-handler');
const { mountAdmin, mountWeb } = require('./web/static');
const { UPLOAD_DIR } = require('./modules/uploads/upload.service');

const app = express();

app.set('trust proxy', 1);
app.use(express.json({ limit: '8mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/media', express.static(path.resolve(__dirname, '../public/media')));
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

app.use('/api/v1', require('./modules/football/routes'));

const v1Router = require('./modules/router/v1.router');

app.use('/api/v1', v1Router);

if (env.REDIS_URL) {
    const bullBoardRouter = require('./infra/queue/bull-board');

    app.use('/admin/queues', bullBoardRouter);
}

mountAdmin(app);
mountWeb(app);

app.use(errorHandler);

module.exports = { app };
