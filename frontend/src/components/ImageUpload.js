import { useState, useRef } from 'react';

export default function ImageUpload({ currentUrl, label = 'Upload Image', onFile }) {
  const [preview, setPreview] = useState(currentUrl || '');
  const inputRef = useRef();

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    onFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="img-upload" onClick={() => inputRef.current.click()}>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} onClick={e => e.stopPropagation()} />
      {preview ? (
        <>
          <img src={preview} alt="preview" className="preview" />
          <div style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>Click to change</div>
        </>
      ) : (
        <div className="placeholder">
          <span className="icon">📷</span>
          {label}
          <div style={{ fontSize: '0.72rem', marginTop: 4, color: 'var(--text3)' }}>JPG, PNG, WebP</div>
        </div>
      )}
    </div>
  );
}
