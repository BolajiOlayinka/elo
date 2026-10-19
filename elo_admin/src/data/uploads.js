import { readFileAsDataUrl } from './posts.js';

export function emptyMedia() {
  return { upload_id: '', file_url: '' };
}

export function createUploadId() {
  return `upl_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeMedia(value) {
  if (!value) {
    return emptyMedia();
  }

  if (typeof value === 'string') {
    return { upload_id: '', file_url: value };
  }

  return {
    upload_id: value.upload_id || '',
    file_url: value.file_url || ''
  };
}

export function mediaUrl(value) {
  return normalizeMedia(value).file_url;
}

export function hasMedia(value) {
  return Boolean(mediaUrl(value));
}

export async function mockUploadFile(file) {
  const { api } = await import('../lib/api.js');
  const { data } = await api('/uploads', {
    method: 'POST',
    body: {
      filename: file.name,
      content_type: file.type,
      data: await readFileAsDataUrl(file)
    }
  });

  return {
    upload_id: data.upload_id,
    file_url: data.file_url
  };
}

export function mediaFromUrl(url) {
  const file_url = String(url || '').trim();

  return {
    upload_id: file_url ? createUploadId() : '',
    file_url
  };
}
