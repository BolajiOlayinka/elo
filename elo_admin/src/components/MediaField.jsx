import { emptyMedia, mediaFromUrl, mediaUrl, mockUploadFile } from '../data/uploads.js';

export function MediaField({ label, hint, value, onChange }) {
  const media = value || emptyMedia();
  const src = mediaUrl(media);

  async function onFile(event) {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) {
      return;
    }

    onChange(await mockUploadFile(file));
  }

  return (
    <div className="image-field">
      <span>{label}</span>
      {src ? (
        <img src={src} alt="" className="image-preview" />
      ) : (
        <div className="image-preview is-empty">No image</div>
      )}
      <input
        value={src.startsWith('data:') ? '' : src}
        onChange={(event) => onChange(mediaFromUrl(event.target.value))}
        placeholder="file_url from upload, or paste https://…"
      />
      {media.upload_id ? (
        <p className="media-ids">
          <span>upload_id</span>
          <code>{media.upload_id}</code>
        </p>
      ) : src ? (
        <p className="muted">No upload_id yet. Upload a file so the desk stores both fields.</p>
      ) : null}
      <div className="image-field-actions">
        <label className="btn ghost file-btn">
          Upload
          <input type="file" accept="image/*" hidden onChange={onFile} />
        </label>
        {src ? (
          <button type="button" className="btn ghost" onClick={() => onChange(emptyMedia())}>Remove</button>
        ) : null}
      </div>
      {hint ? <p className="muted">{hint}</p> : null}
    </div>
  );
}
