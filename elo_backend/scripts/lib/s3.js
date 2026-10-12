'use strict';

const fs = require('fs/promises');
const { GetBucketLocationCommand, PutObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const { s3KeyFor } = require('./json-store');

function awsCredentials() {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY;

    if (!accessKeyId || !secretAccessKey) {
        throw new Error('Set AWS_ACCESS_KEY_ID (or AWS_ACCESS_KEY) and AWS_SECRET_ACCESS_KEY (or AWS_SECRET_KEY)');
    }

    return { accessKeyId, secretAccessKey };
}

function createS3Client(region) {
    return new S3Client({
        region: region || process.env.AWS_REGION || 'us-east-1',
        credentials: awsCredentials(),
        followRegionRedirects: true
    });
}

async function resolveBucketRegion(bucket) {
    if (process.env.AWS_REGION) {
        return process.env.AWS_REGION;
    }

    const locator = createS3Client('us-east-1');
    const result = await locator.send(new GetBucketLocationCommand({ Bucket: bucket }));
    const constraint = result.LocationConstraint;

    if (!constraint) {
        return 'us-east-1';
    }

    if (constraint === 'EU') {
        return 'eu-west-1';
    }

    return constraint;
}

function bucketName() {
    return process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || 'elo-football';
}

async function createUploadContext() {
    const bucket = bucketName();
    const region = await resolveBucketRegion(bucket);

    return {
        bucket,
        region,
        client: createS3Client(region)
    };
}

async function uploadRawFile(context, filePath) {
    const key = s3KeyFor(filePath);
    const body = await fs.readFile(filePath);

    await context.client.send(new PutObjectCommand({
        Bucket: context.bucket,
        Key: key,
        Body: body,
        ContentType: 'application/json'
    }));

    return key;
}

module.exports = {
    awsCredentials,
    createS3Client,
    resolveBucketRegion,
    bucketName,
    createUploadContext,
    uploadRawFile
};
