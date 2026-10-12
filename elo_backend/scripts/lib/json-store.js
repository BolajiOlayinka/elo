'use strict';

const fs = require('fs/promises');
const path = require('path');
const { ROOT, RAW_DIR } = require('./paths');

async function fileExists(filePath) {
    try {
        await fs.access(filePath);

        return true;
    } catch {
        return false;
    }
}

async function readJson(filePath) {
    const raw = await fs.readFile(filePath, 'utf8');

    return JSON.parse(raw);
}

async function writeJson(filePath, payload) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(payload));
}

function s3KeyFor(filePath) {
    return path.relative(path.join(ROOT, 'data', 'raw'), filePath).split(path.sep).join('/');
}

function relativeRaw(filePath) {
    return path.relative(RAW_DIR, filePath);
}

module.exports = {
    fileExists,
    readJson,
    writeJson,
    s3KeyFor,
    relativeRaw
};
