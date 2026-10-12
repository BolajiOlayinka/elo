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
        league: null,
        season: null
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
        } else if (flag === '--league') {
            args.league = Number(argv[index + 1]);
            index += 1;
        } else if (flag === '--season') {
            args.season = Number(argv[index + 1]);
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

    return args;
}

module.exports = {
    parseIngestArgs
};
