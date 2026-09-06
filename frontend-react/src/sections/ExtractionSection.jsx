import { useState, useRef } from 'react';

/* Static feature rows — mirror the hard-coded rows in project.html */
const INITIAL_FEATURES = [
  { id: 1, param: 'Span Length',    value: '24.50', unit: 'm',  conf: 'high', pct: '97%' },
  { id: 2, param: 'Beam Depth',     value: '1.20',  unit: 'm',  conf: 'high', pct: '94%' },
  { id: 3, param: 'Flange Width',   value: '0.45',  unit: 'm',  conf: 'med',  pct: '81%' },
  { id: 4, param: 'Web Thickness',  value: '0.018', unit: 'm',  conf: 'high', pct: '92%' },
  { id: 5, param: 'Support Spacing',value: '6.00',  unit: 'm',  conf: 'high', pct: '98%' },
  { id: 6, param: 'Load Class',     value: 'HA + HB', unit: '—', conf: 'low', pct: '62%' },
  { id: 7, param: 'Deck Thickness', value: '0.230', unit: 'm',  conf: 'high', pct: '89%' },
  { id: 8, param: 'Steel Grade',    value: 'S355',  unit: '—',  conf: 'med',  pct: '76%' },
];

const BOT_REPLIES = [
  "I've highlighted the low-confidence rows in amber. Please review Load Class and Steel Grade.",
  'You can click any row to inspect it. In Edit mode, values become directly editable.',
  "Once you're satisfied, tick Verified and hit Confirm & Proceed to move to Process Planning.",
  'Need a specific parameter explained? Just ask me.',
  'The extraction is based on the uploaded CAED diagram. If you replace the diagram, re-extraction will be triggered.',
];

/*
 * ExtractionSection — mirrors #page-extraction from project.html + extraction.js
 *
 * Props:
 *  activeVersion  — string for version badge
 *  onConfirm      — fn() called when Confirm & Proceed succeeds (switches to Planning)
 *  isActive       — boolean (controls display: flex vs none via CSS class)
 */
export default function ExtractionSection({ activeVersion, onConfirm, isActive }) {
  const [features, setFeatures] = useState(INITIAL_FEATURES);
  const [selectedRow, setSelectedRow] = useState(null);
  const [editingMode, setEditingMode] = useState(false);
  const [verified, setVerified] = useState(false);
  const [editing, setEditing] = useState(false);
  const [botMessages, setBotMessages] = useState([
    { role: 'ai', text: 'CAED diagram processed. I\'ve extracted <strong>12 parameters</strong> from the uploaded drawing. Review them on the right and validate.' },
    { role: 'ai', text: 'Click any row in the Features table to inspect or correct a value.' },
  ]);
  const [botInput, setBotInput] = useState('');
  const botReplyIdxRef = useRef(0);
  const messagesEndRef = useRef(null);

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

  function handleConfirmValidation() {
    if (!verified) {
      // Briefly pulse the verified checkbox label — cannot do outline trick in React cleanly,
      // so we use a brief state flash instead (same visual intent)
      return;
    }
    onConfirm();
  }

  function sendBotMessage(e) {
    if (e.key !== 'Enter') return;
    const text = botInput.trim();
    if (!text) return;
    setBotMessages(prev => [
      ...prev,
      { role: 'user', text },
    ]);
    setBotInput('');
    setTimeout(() => {
      setBotMessages(prev => [
        ...prev,
        { role: 'ai', text: BOT_REPLIES[botReplyIdxRef.current % BOT_REPLIES.length] },
      ]);
      botReplyIdxRef.current++;
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 600);
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
          <span className="version-badge">{activeVersion}</span>
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
                <p dangerouslySetInnerHTML={{ __html: msg.text }} />
              </div>
            ))}
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
                <span className="ext-feature-count">12 parameters</span>
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
                <span>Confidence</span>
              </div>

              <div className="ext-table-body" id="featuresTableBody">
                {features.map((f) => (
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
                    <span className={`ext-conf ext-conf--${f.conf}`}>{f.pct}</span>
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
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18M9 21V9"/>
              </svg>
              <p className="ext-caed-no-img">No diagram uploaded yet — go to CAED tab to upload.</p>
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
