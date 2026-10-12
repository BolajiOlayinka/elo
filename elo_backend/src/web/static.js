const fs = require('fs');
const path = require('path');
const express = require('express');

const BACKEND_ROOT = path.resolve(__dirname, '../..');
const WEB_DIST_CANDIDATES = [
    path.join(BACKEND_ROOT, 'public', 'web'),
    path.resolve(BACKEND_ROOT, '../elo_web/dist')
];

const ADMIN_DIST_CANDIDATES = [
    path.join(BACKEND_ROOT, 'public', 'admin'),
    path.resolve(BACKEND_ROOT, '../elo_admin/dist')
];

function resolveWebDist() {
    return WEB_DIST_CANDIDATES.find((dir) => fs.existsSync(path.join(dir, 'index.html'))) || null;
}

function resolveAdminDist() {
    return ADMIN_DIST_CANDIDATES.find((dir) => fs.existsSync(path.join(dir, 'index.html'))) || null;
}

function mountWeb(app) {
    const webDist = resolveWebDist();

    if (!webDist) {
        app.get('/', (req, res) => {
            res.status(503).json({
                error: true,
                message: 'Web UI not built. From the repo root run: npm run build:web'
            });
        });

        return;
    }

    app.use(express.static(webDist, {
        index: false,
        maxAge: '1h'
    }));

    app.use((req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            next();

            return;
        }

        if (req.path.startsWith('/api') || req.path.startsWith('/admin')) {
            next();

            return;
        }

        res.sendFile(path.join(webDist, 'index.html'), (err) => {
            if (err) {
                next(err);
            }
        });
    });
}

function mountAdmin(app) {
    const adminDist = resolveAdminDist();

    if (!adminDist) {
        return;
    }

    app.use('/admin', express.static(adminDist, {
        index: false,
        maxAge: '1h'
    }));

    app.use('/admin', (req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            next();

            return;
        }

        if (req.path.startsWith('/queues')) {
            next();

            return;
        }

        res.sendFile(path.join(adminDist, 'index.html'), (err) => {
            if (err) {
                next(err);
            }
        });
    });
}

module.exports = {
    mountWeb,
    mountAdmin,
    resolveWebDist,
    resolveAdminDist
};
