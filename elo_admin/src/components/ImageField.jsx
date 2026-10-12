import { readFileAsDataUrl } from '../data/posts.js';

export function ImageField({ label, hint, value, onChange }) {
  async function onFile(event) {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) {
      return;
    }

    onChange(await readFileAsDataUrl(file));
  }

  return (
    <div className="image-field">
      <span>{label}</span>
      {value ? (
        <img src={value} alt="" className="image-preview" />
      ) : (
        <div className="image-preview is-empty">No image</div>
      )}
      <input
        value={typeof value === 'string' && !value.startsWith('data:') ? value : ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder="https://… or upload"
      />
      <div className="image-field-actions">
        <label className="btn ghost file-btn">
          Upload
          <input type="file" accept="image/*" hidden onChange={onFile} />
        </label>
        {value ? (
          <button type="button" className="btn ghost" onClick={() => onChange('')}>Remove</button>
        ) : null}
      </div>
      {hint ? <p className="muted">{hint}</p> : null}
    </div>
  );
}
