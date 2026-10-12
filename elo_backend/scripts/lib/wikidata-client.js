'use strict';

const { setTimeout: sleep } = require('timers/promises');

const ENDPOINT = 'https://query.wikidata.org/sparql';
const QUERY_TIMEOUT_MS = 55_000;
const MAX_ATTEMPTS = 4;
const DEFAULT_GAP_MS = 4000;

function createWikidataClient({ userAgent, minGapMs = DEFAULT_GAP_MS }) {
    const state = {
        used: 0,
        lastCallAt: 0
    };

    async function sparql(query) {
        let lastError = null;

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
            try {
                return await requestOnce(query, { userAgent, minGapMs, state });
            } catch (err) {
                lastError = err;

                if (!isRetryable(err) || attempt === MAX_ATTEMPTS) {
                    throw err;
                }

                const waitMs = err.retryAfterMs || 4000 * attempt;
                console.log(`  wikidata retry ${attempt}/${MAX_ATTEMPTS - 1} in ${Math.round(waitMs / 1000)}s (${err.message})`);
                await sleep(waitMs);
            }
        }

        throw lastError;
    }

    return { sparql, state };
}

async function requestOnce(query, { userAgent, minGapMs, state }) {
    const elapsed = Date.now() - state.lastCallAt;

    if (state.lastCallAt && elapsed < minGapMs) {
        await sleep(minGapMs - elapsed);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), QUERY_TIMEOUT_MS);

    state.lastCallAt = Date.now();

    let response;

    try {
        response = await fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                Accept: 'application/sparql-results+json',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Accept-Encoding': 'gzip,deflate',
                'User-Agent': userAgent
            },
            body: new URLSearchParams({ query, format: 'json' }).toString(),
            signal: controller.signal
        });
    } catch (err) {
        if (err.name === 'AbortError') {
            throw Object.assign(new Error('Wikidata query timed out'), { retryable: true, timedOut: true });
        }

        throw Object.assign(err, { retryable: true });
    } finally {
        clearTimeout(timer);
    }

    state.used += 1;

    if (response.status === 429) {
        const retryAfterMs = (Number(response.headers.get('retry-after')) || 60) * 1000;
        const err = new Error('Wikidata 429 rate limited');
        err.retryable = true;
        err.retryAfterMs = retryAfterMs;
        throw err;
    }

    const bodyText = await response.text();

    if (!response.ok) {
        const err = new Error(`Wikidata HTTP ${response.status}: ${bodyText.slice(0, 180)}`);
        err.retryable = response.status >= 500 || /timeout/i.test(bodyText);
        err.timedOut = /timeout/i.test(bodyText);
        throw err;
    }

    const payload = JSON.parse(bodyText);

    return payload.results?.bindings || [];
}

function isRetryable(err) {
    return Boolean(err && (err.retryable || err.timedOut));
}

function qidFromUri(uri) {
    const match = String(uri || '').match(/\/(Q\d+)$/);

    return match ? match[1] : null;
}

function qidNumber(qid) {
    return Number(String(qid).replace(/^Q/i, '')) || 0;
}

function literal(binding) {
    if (!binding || binding.value == null) {
        return null;
    }

    const value = String(binding.value);

    if (binding.datatype && binding.datatype.includes('date')) {
        return value.slice(0, 10);
    }

    return value;
}

function valuesClause(qids) {
    return qids.map((qid) => `wd:${qid}`).join(' ');
}

function resolveUserAgent() {
    const fromEnv = process.env.WIKIDATA_USER_AGENT;

    if (fromEnv && fromEnv.trim()) {
        return fromEnv.trim();
    }

    return 'elo-points/0.1 (https://www.wikidata.org/wiki/Wikidata:Data_access; football-intelligence ingest)';
}

module.exports = {
    createWikidataClient,
    qidFromUri,
    qidNumber,
    literal,
    valuesClause,
    resolveUserAgent
};
