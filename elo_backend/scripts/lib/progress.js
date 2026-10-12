'use strict';

const fs = require('fs/promises');
const path = require('path');
const { RAW_DIR } = require('./paths');
const { writeJson } = require('./json-store');

function createProgress({ mode, total, dir }) {
    const baseDir = dir || RAW_DIR;
    const logFile = path.join(baseDir, '_ingest.log');
    const statusFile = path.join(baseDir, '_ingest-progress.json');
    const startedAt = Date.now();
    const state = {
        mode,
        total,
        completed: 0,
        skipped: 0,
        failed: 0,
        current: null,
        apiUsed: null,
        dailyRemaining: null,
        updatedAt: null
    };
    let barVisible = false;

    function formatBar(done, all, label) {
        const width = 28;
        const safeTotal = all > 0 ? all : 1;
        const ratio = Math.min(1, Math.max(0, done / safeTotal));
        const filled = Math.round(width * ratio);
        const bar = `${'#'.repeat(filled)}${'-'.repeat(width - filled)}`;
        const pct = String(Math.round(ratio * 100)).padStart(3, ' ');

        return `[${bar}] ${pct}%  ${done}/${all}  ${label}`;
    }

    function clearBar() {
        if (!barVisible) {
            return;
        }

        if (process.stderr.isTTY) {
            process.stderr.write('\n');
        }

        barVisible = false;
    }

    function tick(done, all, label) {
        const line = formatBar(done, all, label);

        if (process.stderr.isTTY) {
            process.stderr.write(`\r${line}`);
            barVisible = true;

            return;
        }

        if (done === all || done === 1 || done % 25 === 0) {
            console.log(line);
        }
    }

    async function log(message) {
        clearBar();
        const line = `${new Date().toISOString()}  ${message}`;

        console.log(line);
        await fs.mkdir(baseDir, { recursive: true });
        await fs.appendFile(logFile, `${line}\n`);
    }

    async function snapshot(extra = {}) {
        Object.assign(state, extra, { updatedAt: new Date().toISOString() });
        await writeJson(statusFile, {
            ...state,
            elapsedSec: Math.round((Date.now() - startedAt) / 1000),
            logFile,
            statusFile
        });
    }

    return {
        state,
        tick,
        clearBar,
        log,
        snapshot,
        logFile,
        statusFile
    };
}

function describeDbTarget(live, knexConfig) {
    if (live) {
        const url = new URL(process.env.DATABASE_URL);

        return `Heroku ${url.hostname}`;
    }

    const connection = knexConfig.development.connection;

    return `local ${connection.host}:${connection.port}/${connection.database}`;
}

module.exports = {
    createProgress,
    describeDbTarget
};
