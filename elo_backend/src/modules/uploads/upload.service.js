const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const AnalysisRepository = require('../analysis/analysis.repository');
const BadRequestException = require('../../shared/exceptions/bad-request.exception');

const UPLOAD_DIR = path.resolve(__dirname, '../../../data/uploads');
const ALLOWED_MIME = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml'
]);

function extensionFor(mime, filename) {
    const fromName = path.extname(filename || '').toLowerCase();

    if (fromName && fromName.length <= 8) {
        return fromName;
    }

    const map = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
        'image/gif': '.gif',
        'image/svg+xml': '.svg'
    };

    return map[mime] || '.bin';
}

function parsePayload(input) {
    const raw = String(input.data || '');
    const match = raw.match(/^data:([^;]+);base64,(.+)$/);
    const mime = input.content_type || (match ? match[1] : 'application/octet-stream');
    const base64 = match ? match[2] : raw;
    const buffer = Buffer.from(base64, 'base64');

    if (!buffer.length) {
        throw new BadRequestException('Upload payload was empty');
    }

    if (buffer.length > 8 * 1024 * 1024) {
        throw new BadRequestException('Upload must be 8MB or smaller');
    }

    if (!ALLOWED_MIME.has(mime)) {
        throw new BadRequestException('Only image uploads are accepted');
    }

    return { buffer, mime, filename: input.filename };
}

function cloudinaryConfig() {
    const cloud = process.env.CLOUD_NAME;
    const key = process.env.CLOUDINARY_API_KEY;
    const secret = process.env.CLOUDINARY_API_SECRET;

    if (!cloud || !key || !secret) {
        return null;
    }

    return { cloud, key, secret };
}

async function uploadToCloudinary({ buffer, mime, filename }) {
    const config = cloudinaryConfig();

    if (!config) {
        return null;
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'elostats-analysis';
    const signature = crypto
        .createHash('sha1')
        .update(`folder=${folder}&timestamp=${timestamp}${config.secret}`)
        .digest('hex');
    const form = new FormData();
    const blob = new Blob([buffer], { type: mime });

    form.append('file', blob, filename);
    form.append('api_key', config.key);
    form.append('timestamp', String(timestamp));
    form.append('signature', signature);
    form.append('folder', folder);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloud}/image/upload`, {
        method: 'POST',
        body: form
    });

    if (!response.ok) {
        return null;
    }

    const payload = await response.json();

    if (!payload.secure_url) {
        return null;
    }

    return {
        upload_id: payload.public_id,
        file_url: payload.secure_url
    };
}

function saveToDisk({ buffer, mime, filename }) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });

    const uploadId = `upl_${crypto.randomUUID()}`;
    const storedName = `${uploadId}${extensionFor(mime, filename)}`;

    fs.writeFileSync(path.join(UPLOAD_DIR, storedName), buffer);

    return {
        upload_id: uploadId,
        file_url: `/uploads/${storedName}`
    };
}

class UploadService {
    static async create(input) {
        const parsed = parsePayload(input);
        const remote = await uploadToCloudinary(parsed);
        const media = remote || saveToDisk(parsed);

        await AnalysisRepository.insertUpload({
            id: media.upload_id,
            file_url: media.file_url,
            original_name: parsed.filename,
            mime: parsed.mime
        });

        return media;
    }
}

module.exports = {
    UploadService,
    UPLOAD_DIR
};
