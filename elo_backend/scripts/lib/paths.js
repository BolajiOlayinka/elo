'use strict';

const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const RAW_DIR = path.join(ROOT, 'data', 'raw', 'api-football');
const WIKIDATA_RAW_DIR = path.join(ROOT, 'data', 'raw', 'wikidata');

function rawFile(...parts) {
    return path.join(RAW_DIR, ...parts);
}

function wikidataFile(...parts) {
    return path.join(WIKIDATA_RAW_DIR, ...parts);
}

module.exports = {
    ROOT,
    RAW_DIR,
    WIKIDATA_RAW_DIR,
    rawFile,
    wikidataFile
};
