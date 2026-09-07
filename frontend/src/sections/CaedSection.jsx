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
export default function CaedSection({ activeVersion, projectId, uploadedFile, onFileSelected, onFileUploaded, onExtractionComplete }) {
  const [dragOver, setDragOver] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState('');
  const fileInputRef = useRef(null);

  /* Upload type texts */
  const uploadTitle = 'Drop your CAED diagram here';
  const uploadHint = 'or click to browse — PDF or Image accepted';
  const fileAccept = '.pdf,.png,.jpg,.jpeg,.tiff,.bmp,.webp';

  function triggerFileInput() {
    fileInputRef.current.click();
  }

  function processFile(file) {
    const isImage = /\.(png|jpg|jpeg|tiff|bmp|webp)$/i.test(file.name);
    const isPdf = file.name.toLowerCase().endsWith('.pdf');

    if (!isImage && !isPdf) {
      alert('Please upload a PDF or image file for a single page diagram.');
      return;
    }

    const now = new Date();
    setIsExtracting(true);
    setExtractionError('');
    const uploadedAt =
      'Uploaded ' +
      now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' at ' +
      now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onFileSelected({ name: file.name, size: formatFileSize(file.size), uploadedAt, thumbSrc: e.target.result });
      };
      reader.readAsDataURL(file);
    } else {
      onFileSelected({ name: file.name, size: formatFileSize(file.size), uploadedAt, thumbSrc: null });
    }

    onFileUploaded(now);

    const formData = new FormData();
    formData.append('files', file);
    fetch(`http://localhost:3000/api/projects/${projectId}/engineering/extract-files`, {
      method: 'POST',
      body: formData,
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || payload.success === false) {
          throw new Error(payload.message || 'Gemini extraction failed');
        }
        onExtractionComplete(payload.data);
      })
      .catch((error) => setExtractionError(error.message))
      .finally(() => setIsExtracting(false));
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
      </div>

      {/* Upload type toggle */}
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
              {isExtracting && <p className="preview-processing">Analyzing drawing with Gemini…</p>}
              {extractionError && <p className="preview-error">{extractionError}</p>}
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
