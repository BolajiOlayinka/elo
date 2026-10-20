'use strict';

function parseIngestArgs(argv) {
    const args = {
        smoke: false,
        skipS3: false,
        live: false,
        all: false,
        resume: true,
        verbose: false,
        allowPartial: false,
        everything: false,
        league: null,
        season: null,
        player: null,
        coach: null,
        maxRequests: null
    };

    for (let index = 2; index < argv.length; index += 1) {
        const flag = argv[index];

        if (flag === '--smoke') {
            args.smoke = true;
        } else if (flag === '--skip-s3') {
            args.skipS3 = true;
        } else if (flag === '--live') {
            args.live = true;
        } else if (flag === '--all') {
            args.all = true;
        } else if (flag === '--resume') {
            args.resume = true;
        } else if (flag === '--fresh') {
            args.resume = false;
        } else if (flag === '--verbose') {
            args.verbose = true;
        } else if (flag === '--allow-partial') {
            args.allowPartial = true;
        } else if (flag === '--everything') {
            args.everything = true;
        } else if (flag === '--league') {
            args.league = Number(argv[index + 1]);
            index += 1;
        } else if (flag === '--season') {
            args.season = Number(argv[index + 1]);
            index += 1;
        } else if (flag === '--player') {
            args.player = Number(argv[index + 1]);
            index += 1;
        } else if (flag === '--coach') {
            args.coach = Number(argv[index + 1]);
            index += 1;
        } else if (flag === '--max-requests') {
            args.maxRequests = Number(argv[index + 1]);
            index += 1;
        } else {
            throw new Error(`Unknown argument: ${flag}`);
        }
    }

    if (args.league != null && !Number.isFinite(args.league)) {
        throw new Error('--league must be a number (API-Football league id)');
    }

    if (args.season != null && !Number.isFinite(args.season)) {
        throw new Error('--season must be a number (e.g. 2024)');
    }

    if (args.player != null && !Number.isFinite(args.player)) {
        throw new Error('--player must be a number (API-Football player id)');
    }

    if (args.coach != null && !Number.isFinite(args.coach)) {
        throw new Error('--coach must be a number (API-Football coach id)');
    }

    if (args.maxRequests != null && (!Number.isFinite(args.maxRequests) || args.maxRequests < 0)) {
        throw new Error('--max-requests must be 0 (no local cap) or a positive number');
    }

    return args;
}

module.exports = {
    parseIngestArgs
};
