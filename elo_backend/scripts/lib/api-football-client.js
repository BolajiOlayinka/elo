'use strict';

const { setTimeout: sleep } = require('timers/promises');

const BASE_URL = 'https://v3.football.api-sports.io';
const MIN_DAILY_REMAINING = 2;
const MAX_ATTEMPTS = 4;

function createClient({ apiKey, maxRequests, minGapMs = 250, verbose = false }) {
    const state = {
        used: 0,
        maxRequests,
        dailyRemaining: null,
        dailyLimit: null,
        minuteRemaining: null,
        lastCallAt: 0
    };

    async function get(pathname, params = {}) {
        if (state.maxRequests != null && state.used >= state.maxRequests) {
            throw new Error(`Stopped: local budget of ${state.maxRequests} requests reached`);
        }

        if (state.dailyRemaining !== null && state.dailyRemaining <= MIN_DAILY_REMAINING) {
            throw new Error(`Stopped: only ${state.dailyRemaining} daily requests left`);
        }

        const url = new URL(pathname, BASE_URL);

        for (const [key, value] of Object.entries(params)) {
            if (value !== null && value !== '') {
                url.searchParams.set(key, String(value));
            }
        }

        return requestWithRetry(url, { apiKey, minGapMs, state, pathname, verbose });
    }

    return { get, state };
}

async function requestWithRetry(url, context) {
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        try {
            return await requestOnce(url, context);
        } catch (err) {
            lastError = err;

            const paused = pauseReason(err);

            if (paused || !isRetryable(err) || attempt === MAX_ATTEMPTS) {
                if (paused && !String(err.message).startsWith('Stopped:')) {
                    throw new Error(paused);
                }

                throw err;
            }

            const waitMs = 2000 * attempt;

            console.log(`  retry ${attempt}/${MAX_ATTEMPTS - 1} ${context.pathname} in ${waitMs}ms (${err.message})`);
            await sleep(waitMs);
        }
    }

    throw lastError;
}

async function requestOnce(url, { apiKey, minGapMs, state, pathname, verbose }) {
    const elapsed = Date.now() - state.lastCallAt;

    if (state.lastCallAt && elapsed < minGapMs) {
        await sleep(minGapMs - elapsed);
    }

    if (state.minuteRemaining !== null && state.minuteRemaining <= 1) {
        console.log('  minute rate limit low; waiting 15s');
        await sleep(15_000);
    }

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'x-apisports-key': apiKey
        }
    });

    captureRateLimits(state, response.headers);
    state.used += 1;
    state.lastCallAt = Date.now();

    const body = await parseJsonBody(response);
    const apiErrors = body.errors;

    if (!response.ok) {
        throw httpOrQuotaError(response.status, pathname, apiErrors || body);
    }

    if (apiErrors && !Array.isArray(apiErrors) && Object.keys(apiErrors).length > 0) {
        throw quotaOrApiError(pathname, apiErrors);
    }

    if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        throw quotaOrApiError(pathname, apiErrors);
    }

    if (verbose) {
        console.log(
            `  [${state.used}/${state.maxRequests ?? '?'}] GET ${url.pathname}${url.search}`
            + `  daily left=${state.dailyRemaining ?? '?'}`
        );
    }

    return body;
}

async function parseJsonBody(response) {
    const text = await response.text();

    try {
        return JSON.parse(text);
    } catch {
        throw new Error(`HTTP ${response.status} invalid JSON`);
    }
}

function isRetryable(err) {
    const message = err.message || '';

    return message.includes('HTTP 429')
        || message.includes('HTTP 500')
        || message.includes('HTTP 502')
        || message.includes('HTTP 503')
        || message.includes('HTTP 504')
        || message.includes('invalid JSON')
        || message.includes('fetch failed');
}

function captureRateLimits(state, headers) {
    state.dailyLimit = parseHeader(headers, 'x-ratelimit-requests-limit') ?? state.dailyLimit;
    state.dailyRemaining = parseHeader(headers, 'x-ratelimit-requests-remaining') ?? state.dailyRemaining;
    state.minuteRemaining = parseHeader(headers, 'x-ratelimit-remaining')
        ?? parseHeader(headers, 'X-Ratelimit-Remaining')
        ?? state.minuteRemaining;
}

function parseHeader(headers, headerName) {
    const raw = headers.get(headerName);

    if (raw === null) {
        return null;
    }

    const parsed = Number(raw);

    return Number.isFinite(parsed) ? parsed : null;
}

function httpOrQuotaError(httpStatus, pathname, detail) {
    const blob = JSON.stringify(detail);
    const paused = pauseReason(new Error(`HTTP ${httpStatus} ${pathname}: ${blob}`));

    if (paused) {
        return new Error(paused);
    }

    return new Error(`HTTP ${httpStatus} ${pathname}: ${blob}`);
}

function quotaOrApiError(pathname, apiErrors) {
    const blob = JSON.stringify(apiErrors);
    const paused = pauseReason(new Error(`${pathname} error: ${blob}`));

    if (paused) {
        return new Error(paused);
    }

    return new Error(`${pathname} error: ${blob}`);
}

function pauseReason(err) {
    const message = String(err && err.message);
    const lower = message.toLowerCase();

    if (message.startsWith('Stopped:')) {
        return message;
    }

    if (lower.includes('http 401')) {
        return 'Stopped: API key rejected (HTTP 401). Fix API_FOOTBALL_KEY, then re-run npm run ingest:download:all.';
    }

    if (lower.includes('http 403')) {
        return 'Stopped: API access denied (HTTP 403). Check the key/plan, then re-run npm run ingest:download:all.';
    }

    const quotaHit = lower.includes('http 429')
        || lower.includes('request limit')
        || lower.includes('reached the request')
        || lower.includes('too many requests')
        || (lower.includes('"requests"') && lower.includes('limit'));

    if (quotaHit) {
        return 'Stopped: API daily quota reached. Re-run npm run ingest:download:all after the quota resets.';
    }

    return null;
}

module.exports = {
    createClient,
    pauseReason
};
