'use strict';

/**
 * Put / head / delete a tiny object on the football bucket.
 *
 *   node scripts/smoke-s3.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const {
    PutObjectCommand,
    HeadObjectCommand,
    DeleteObjectCommand
} = require('@aws-sdk/client-s3');
const { createS3Client, resolveBucketRegion, bucketName } = require('./lib/s3');

async function main() {
    const bucket = bucketName();
    const key = `api-football/_smoke/probe-${Date.now()}.txt`;
    const region = await resolveBucketRegion(bucket);
    const client = createS3Client(region);

    console.log(`S3 smoke bucket=${bucket} region=${region} key=${key}`);

    await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: 'elo-football smoke test',
        ContentType: 'text/plain'
    }));
    console.log('  put ok');

    const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    console.log(`  head ok content-length=${head.ContentLength}`);

    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    console.log('  delete ok');
    console.log('S3 access looks good');
}

main().catch((err) => {
    console.error(err.message || err);
    process.exitCode = 1;
});
