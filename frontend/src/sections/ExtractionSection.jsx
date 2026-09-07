import { useState, useRef, useEffect } from 'react';

/*
 * ExtractionSection — mirrors #page-extraction from project.html + extraction.js
 *
 * Props:
 *  activeVersion  — string for version badge
 *  onConfirm      — fn() called when Confirm & Proceed succeeds (switches to Planning)
 *  isActive       — boolean (controls display: flex vs none via CSS class)
 */
export default function ExtractionSection({ activeVersion, projectId, uploadedFile, context, onConfirm, isActive }) {
  const [contextData, setContextData] = useState(() => context?.contextData || context || null);
  const [features, setFeatures] = useState(() => context ? contextToFeatures(context) : []);
  const [isLoading, setIsLoading] = useState(!context);
  const [loadError, setLoadError] = useState('');
  const [selectedRow, setSelectedRow] = useState(null);
  const [editingMode, setEditingMode] = useState(false);
  const [verified, setVerified] = useState(false);
  const [editing, setEditing] = useState(false);
  const [botMessages, setBotMessages] = useState([]);
  const [botLoading, setBotLoading] = useState(false);
  const [botInput, setBotInput] = useState('');
  const messagesEndRef = useRef(null);

  function contextToFeatures(data) {
    const contextData = data.contextData || data;
    const dimensions = contextData.geometry?.overallDimensions || [];
    const featureRows = (contextData.geometry?.features || []).flatMap((feature, featureIndex) =>
      (feature.dimensions || []).map((dimension, dimensionIndex) => ({
        id: `feature-${featureIndex}-${dimensionIndex}`,
        source: { type: 'feature', featureIndex, dimensionIndex },
        param: dimension.name || feature.name || feature.type || 'Feature',
        value: dimension.rawValue ?? dimension.value ?? '',
        unit: dimension.unit || '—',
        conf: dimension.critical ? 'high' : 'med',
        pct: '—',
      })),
    );
    return [...dimensions.map((dimension, index) => ({
      id: `dimension-${index}`,
      source: { type: 'dimension', index },
      param: dimension.name,
      value: dimension.rawValue ?? dimension.value ?? '',
      unit: dimension.unit || '—',
      conf: dimension.critical ? 'high' : 'med',
      pct: '—',
    })), ...featureRows];
  }

  function hasExtractedRows(data) {
    return contextToFeatures(data).length > 0;
  }

  useEffect(() => {
    if (context) {
      setContextData(context.contextData || context);
      setFeatures(contextToFeatures(context));
    }
  }, [context]);

  useEffect(() => {
    if (!isActive || !projectId) return;

    setIsLoading(true);
    setLoadError('');
    async function loadContext() {
      const response = await fetch(`http://localhost:3000/api/projects/${projectId}/engineering/context`);
      const payload = await response.json();
      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || 'Unable to load extracted context');
      }

      if (payload.data && hasExtractedRows(payload.data)) {
        setContextData(payload.data.contextData || payload.data);
        setFeatures(contextToFeatures(payload.data));
        return;
      }

      // A failed/empty extraction can be the newest document; retain the latest usable result.
      const historyResponse = await fetch(`http://localhost:3000/api/projects/${projectId}/engineering/contexts`);
      const historyPayload = await historyResponse.json();
      if (!historyResponse.ok || historyPayload.success === false) {
        throw new Error(historyPayload.message || 'Unable to load extraction history');
      }

      const usableContext = (historyPayload.data || []).find(hasExtractedRows);
      if (usableContext) setFeatures(contextToFeatures(usableContext));
      if (usableContext) setContextData(usableContext.contextData || usableContext);
    }

    loadContext()
      .catch((error) => setLoadError(error.message))
      .finally(() => setIsLoading(false));
  }, [isActive, projectId]);

  useEffect(() => {
    if (!isActive || !projectId) return;
    fetch(`http://localhost:3000/api/projects/${projectId}/conversations`)
      .then(response => response.json())
      .then(payload => {
        if (payload.success === false) throw new Error(payload.message || 'Unable to load conversation');
        const conversation = (payload.data || []).find(item => item.type === 'EXTRACTION');
        setBotMessages((conversation?.messages || []).map(message => ({
          role: message.role === 'assistant' ? 'ai' : 'user',
          text: message.content,
        })));
      })
      .catch(() => setBotMessages([]));
  }, [isActive, projectId]);

  /* Derived validation status — mirrors updateValidationState() */
  let validationStatus = '— Not validated';
  let validationColor = '';
  if (editing) {
    validationStatus = '✎ Currently being edited';
    validationColor = '#ffc107';
  } else if (verified) {
    validationStatus = '✓ Verified — ready to proceed';
    validationColor = '#4caf82';
  }

  function handleSelectRow(id) {
    setSelectedRow(id);
    // If in editing mode, the contentEditable on the value cell handles focus natively
  }

  function toggleEditing() {
    const next = !editingMode;
    setEditingMode(next);
    setEditing(next);
    if (!next) setEditing(false);
  }

  function handleVerifiedChange(e) {
    setVerified(e.target.checked);
  }

  function handleEditingChange(e) {
    setEditing(e.target.checked);
  }

  function handleValueBlur(id, newValue) {
    setFeatures(prev => prev.map(f => f.id === id ? { ...f, value: newValue } : f));
  }

  async function handleConfirmValidation() {
    if (!verified) {
      // Briefly pulse the verified checkbox label — cannot do outline trick in React cleanly,
      // so we use a brief state flash instead (same visual intent)
      return;
    }
    if (contextData) {
      const geometry = {
        overallDimensions: [...(contextData.geometry?.overallDimensions || [])],
        features: (contextData.geometry?.features || []).map(feature => ({
          ...feature,
          dimensions: [...(feature.dimensions || [])],
        })),
      };
      let changed = false;
      features.forEach(row => {
        const value = String(row.value ?? '');
        const dimension = row.source.type === 'dimension'
          ? geometry.overallDimensions[row.source.index]
          : geometry.features[row.source.featureIndex]?.dimensions?.[row.source.dimensionIndex];
        if (dimension && String(dimension.rawValue ?? dimension.value ?? '') !== value) {
          dimension.rawValue = value;
          dimension.value = Number.isFinite(Number(value)) ? Number(value) : null;
          changed = true;
        }
      });
      if (changed) {
        const response = await fetch(`http://localhost:3000/api/projects/${projectId}/engineering/correct`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ corrections: { geometry } }),
        });
        const payload = await response.json();
        if (!response.ok || payload.success === false) throw new Error(payload.message || 'Changes could not be saved');
        setContextData(payload.data.contextData || payload.data);
      }
    }
    onConfirm();
  }

  async function sendBotMessage(e) {
    if (e.key !== 'Enter') return;
    const text = botInput.trim();
    if (!text) return;
    setBotMessages(prev => [
      ...prev,
      { role: 'user', text },
    ]);
    setBotInput('');
    setBotLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/projects/${projectId}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'EXTRACTION', message: text }),
      });
      const payload = await response.json();
      if (!response.ok || payload.success === false) throw new Error(payload.message || 'Message could not be sent');
      const messages = payload.data?.messages || [];
      const reply = messages[messages.length - 1];
      setBotMessages(prev => [
        ...prev,
        { role: 'ai', text: reply?.content || 'No response was returned.' },
      ]);
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      setBotMessages(prev => [...prev, { role: 'ai', text: `Unable to send message: ${error.message}` }]);
    } finally {
      setBotLoading(false);
    }
  }

  function handleSendClick() {
    sendBotMessage({ key: 'Enter' });
  }

  return (
    <section className={`page-section${isActive ? ' active' : ''}`} id="page-extraction">

      {/* Header */}
      <div className="page-header">
        <div className="page-header__left">
          <h2 className="page-section-title">Extraction &amp; Validation</h2>
          <p className="page-section-sub">AI-extracted parameters from the CAED diagram</p>
        </div>
        <div className="page-header__right">
        </div>
      </div>

      {/* ── Main 2-column layout: Bot | Content ── */}
      <div className="ext-layout">

        {/* ── LEFT: AI Bot Panel ── */}
        <div className="ext-bot-panel">
          <div className="ext-bot-header">
            <div className="ext-bot-avatar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                <circle cx="12" cy="16" r="1"/>
              </svg>
            </div>
            <span className="ext-bot-name">C2P Bot</span>
            <span className="ext-bot-status">online</span>
          </div>

          {/* Chat messages */}
          <div className="ext-bot-messages" id="botMessages">
            {botMessages.map((msg, i) => (
              <div key={i} className={`bot-msg bot-msg--${msg.role === 'ai' ? 'ai' : 'user'}`}>
                <p>{msg.text}</p>
              </div>
            ))}
            {botLoading && <div className="bot-msg bot-msg--ai"><p>Reviewing the persisted extraction…</p></div>}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="ext-bot-input-wrap">
            <input
              className="ext-bot-input"
              id="botInput"
              type="text"
              placeholder="Ask C2P Bot…"
              value={botInput}
              onChange={(e) => setBotInput(e.target.value)}
              onKeyDown={sendBotMessage}
            />
            <button className="ext-bot-send" onClick={handleSendClick}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── RIGHT: Features + CAED preview ── */}
        <div className="ext-right-col">

          {/* Features Extracted table */}
          <div className="ext-features-panel">
            <div className="ext-features-header">
              <span className="ext-features-title">Features Extracted</span>
              <div className="ext-features-actions">
                <span className="ext-feature-count">{isLoading ? 'Loading…' : `${features.length} parameters`}</span>
                <button className="ext-sort-btn" title="Sort">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <polyline points="19 12 12 19 5 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="ext-features-table">
              <div className="ext-table-head">
                <span>Parameter</span>
                <span>Extracted Value</span>
                <span>Unit</span>
              </div>

              <div className="ext-table-body" id="featuresTableBody">
                {isLoading && (
                  <div className="ui-loading">
                    <span className="ui-spinner"></span>
                    <span>Loading extracted parameters</span>
                  </div>
                )}
                {!isLoading && loadError && (
                  <div className="ui-empty">
                    <strong>Extraction data unavailable</strong>
                    <span>{loadError}</span>
                  </div>
                )}
                {!isLoading && !loadError && features.length === 0 && (
                  <div className="ui-empty">
                    <strong>No extracted parameters yet</strong>
                    <span>Upload a CAED drawing and return here to review the result.</span>
                  </div>
                )}
                {!isLoading && !loadError && features.map((f) => (
                  <div
                    key={f.id}
                    className={`ext-row${selectedRow === f.id ? ' selected' : ''}`}
                    onClick={() => handleSelectRow(f.id)}
                  >
                    <span className="ext-param">{f.param}</span>
                    <span
                      className="ext-value editable"
                      contentEditable={editingMode}
                      suppressContentEditableWarning
                      onBlur={(e) => handleValueBlur(f.id, e.currentTarget.textContent)}
                    >
                      {f.value}
                    </span>
                    <span className="ext-unit">{f.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CAED Image Preview */}
          <div className="ext-caed-preview">
            <div className="ext-caed-preview-header">
              <span className="ext-features-title">CAED Image</span>
              <span className="ext-caed-hint">Reference view</span>
            </div>
            <div className="ext-caed-img-area" id="caedPreviewArea">
              {uploadedFile?.thumbSrc ? (
                <img
                  src={uploadedFile.thumbSrc}
                  alt="Uploaded CAED drawing"
                  className="ext-caed-preview-image"
                />
              ) : (
                <>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M3 9h18M9 21V9"/>
                  </svg>
                  <p className="ext-caed-no-img">No diagram uploaded yet — go to CAED tab to upload.</p>
                </>
              )}
            </div>
          </div>

        </div>{/* end .ext-right-col */}

      </div>{/* end .ext-layout */}

      {/* ── Validation Bar ── */}
      <div className="ext-validation-bar">
        <div className="ext-validation-checks">
          <label className="ext-check-item">
            <input
              type="checkbox"
              id="checkVerified"
              checked={verified}
              onChange={handleVerifiedChange}
            />
            <span className="ext-check-box">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </span>
            <span className="ext-check-label">Verified</span>
          </label>
          <label className="ext-check-item">
            <input
              type="checkbox"
              id="checkEditing"
              checked={editing}
              onChange={handleEditingChange}
            />
            <span className="ext-check-box ext-check-box--edit">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </span>
            <span className="ext-check-label">Editing</span>
          </label>
          <span
            className="ext-validation-status"
            id="validationStatus"
            style={validationColor ? { color: validationColor } : {}}
          >
            {validationStatus}
          </span>
        </div>
        <div className="ext-validation-actions">
          <button
            className="ext-btn-edit"
            onClick={toggleEditing}
            style={editingMode ? {
              borderColor: 'rgba(255,193,7,0.4)',
              color: '#ffc107',
              background: 'rgba(255,193,7,0.08)',
            } : {}}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            {editingMode ? 'Done Editing' : 'Edit Values'}
          </button>
          <button className="ext-btn-confirm" onClick={handleConfirmValidation}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Confirm &amp; Proceed
          </button>
        </div>
      </div>

    </section>
  );
}
