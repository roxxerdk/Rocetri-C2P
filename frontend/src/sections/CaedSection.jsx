import { useState, useRef } from 'react';

/* Helpers */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/*
 * CaedSection — mirrors #page-caed from project.html.
 * Handles:
 *  - upload type toggle (single / multi)
 *  - drag-over state on drop zone
 *  - file selection (shows preview)
 *  - file replace
 *
 * Props:
 *  activeVersion — string for the version badge
 *  onFileUploaded — fn(Date) called when a file is processed (to sync datetime)
 */
export default function CaedSection({ activeVersion, onFileUploaded }) {
  const [uploadType, setUploadType] = useState('single');
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null); // null | { name, size, uploadedAt, thumbSrc }
  const fileInputRef = useRef(null);

  /* Upload type texts */
  const uploadTitle = uploadType === 'single'
    ? 'Drop your CAED diagram here'
    : 'Drop your CAED ZIP archive here';
  const uploadHint = uploadType === 'single'
    ? 'or click to browse — PDF or Image accepted'
    : 'or click to browse — ZIP file with multiple CAED views';
  const fileAccept = uploadType === 'single'
    ? '.pdf,.png,.jpg,.jpeg,.tiff,.bmp,.webp'
    : '.zip';

  function handleSetUploadType(type) {
    setUploadType(type);
    setUploadedFile(null); // reset zone
  }

  function triggerFileInput() {
    fileInputRef.current.click();
  }

  function processFile(file) {
    const isZip = file.name.toLowerCase().endsWith('.zip');
    const isImage = /\.(png|jpg|jpeg|tiff|bmp|webp)$/i.test(file.name);
    const isPdf = file.name.toLowerCase().endsWith('.pdf');

    if (uploadType === 'multi' && !isZip) {
      alert('Please upload a ZIP file for multiple views.');
      return;
    }
    if (uploadType === 'single' && !isImage && !isPdf) {
      alert('Please upload a PDF or image file for a single page diagram.');
      return;
    }

    const now = new Date();
    const uploadedAt =
      'Uploaded ' +
      now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' at ' +
      now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedFile({ name: file.name, size: formatFileSize(file.size), uploadedAt, thumbSrc: e.target.result });
      };
      reader.readAsDataURL(file);
    } else {
      setUploadedFile({ name: file.name, size: formatFileSize(file.size), uploadedAt, thumbSrc: null });
    }

    onFileUploaded(now);
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) processFile(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  return (
    <section className="page-section active" id="page-caed">

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header__left">
          <h2 className="page-section-title">CAED Diagram</h2>
          <p className="page-section-sub">Upload your CAED drawing for extraction</p>
        </div>
        <div className="page-header__right">
          <span className="version-badge" id="headerVersionBadge">{activeVersion}</span>
        </div>
      </div>

      {/* Upload type toggle */}
      <div className="upload-type-toggle">
        <button
          className={`upload-type-btn${uploadType === 'single' ? ' active' : ''}`}
          id="btnSingle"
          onClick={() => handleSetUploadType('single')}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          Single page
          <span className="upload-type-hint">PDF / Image</span>
        </button>
        <button
          className={`upload-type-btn${uploadType === 'multi' ? ' active' : ''}`}
          id="btnMulti"
          onClick={() => handleSetUploadType('multi')}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="21 8 21 21 3 21 3 8"/>
            <rect x="1" y="3" width="22" height="5"/>
            <line x1="10" y1="12" x2="14" y2="12"/>
          </svg>
          Multiple views
          <span className="upload-type-hint">ZIP file</span>
        </button>
      </div>

      {/* Drop Zone */}
      <div
        className={`upload-zone${dragOver ? ' drag-over' : ''}`}
        id="uploadZone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!uploadedFile ? triggerFileInput : undefined}
      >
        {/* Empty State */}
        {!uploadedFile && (
          <div className="upload-zone__empty" id="uploadEmpty">
            <div className="upload-icon-wrap">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 16 12 12 8 16"/>
                <line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
              </svg>
            </div>
            <p className="upload-zone__title" id="uploadTitle">{uploadTitle}</p>
            <p className="upload-zone__hint" id="uploadHint">{uploadHint}</p>
            <button
              className="btn-upload"
              onClick={(e) => { triggerFileInput(); e.stopPropagation(); }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 16 12 12 8 16"/>
                <line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
              </svg>
              Upload CAED
            </button>
          </div>
        )}

        {/* Preview State */}
        {uploadedFile && (
          <div className="upload-zone__preview" id="uploadPreview" style={{ display: 'flex' }}>
            <div className="preview-thumbnail" id="previewThumb">
              {uploadedFile.thumbSrc ? (
                <img src={uploadedFile.thumbSrc} alt="CAED preview" />
              ) : (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              )}
            </div>
            <div className="preview-info">
              <p className="preview-filename" id="previewFilename">{uploadedFile.name}</p>
              <p className="preview-filesize" id="previewFilesize">{uploadedFile.size}</p>
              <p className="preview-uploaded-at" id="previewUploadedAt">{uploadedFile.uploadedAt}</p>
            </div>
            <div className="preview-actions">
              <button
                className="btn-replace"
                onClick={(e) => { triggerFileInput(); e.stopPropagation(); }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"/>
                  <polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
                Replace
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        id="fileInput"
        style={{ display: 'none' }}
        accept={fileAccept}
        onChange={handleFileSelect}
      />

    </section>
  );
}
