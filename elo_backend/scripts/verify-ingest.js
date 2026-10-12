'use strict';

/**
 * Check that all 922 player-match-stat seasons are fully on disk.
 *
 *   node scripts/verify-ingest.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { formatVerifyReport, verifyDownloadedSeasons } = require('./lib/verify-download');

async function main() {
    const report = await verifyDownloadedSeasons();

    console.log(formatVerifyReport(report));

    if (report.incomplete > 0 || report.total === 0) {
        process.exitCode = 1;
    }
}

main().catch((err) => {
    console.error(err.message || err);
    process.exitCode = 1;
});
