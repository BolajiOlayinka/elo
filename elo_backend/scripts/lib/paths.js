'use strict';

const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const RAW_DIR = path.join(ROOT, 'data', 'raw', 'api-football');
const WIKIDATA_RAW_DIR = path.join(ROOT, 'data', 'raw', 'wikidata');
const STATSBOMB_RAW_DIR = path.join(ROOT, 'data', 'raw', 'statsbomb');

function rawFile(...parts) {
    return path.join(RAW_DIR, ...parts);
}

function wikidataFile(...parts) {
    return path.join(WIKIDATA_RAW_DIR, ...parts);
}

function statsbombFile(...parts) {
    return path.join(STATSBOMB_RAW_DIR, ...parts);
}

module.exports = {
    ROOT,
    RAW_DIR,
    WIKIDATA_RAW_DIR,
    STATSBOMB_RAW_DIR,
    rawFile,
    wikidataFile,
    statsbombFile
};
