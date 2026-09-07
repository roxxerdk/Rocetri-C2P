import { useState, useRef, useEffect } from 'react';

/* Drag-handle SVG */
function DragHandle() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9"  cy="5"  r="1"/><circle cx="9"  cy="12" r="1"/><circle cx="9"  cy="19" r="1"/>
      <circle cx="15" cy="5"  r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
    </svg>
  );
}

/*
 * PlanningSection — mirrors #page-planning from project.html + planning.js
 *
 * Steps are stored as React state. Drag-and-drop reorder uses native HTML5
 * drag events, same as the original.
 *
 * Props:
 *  activeVersion — string for version badge
 *  onCreateReport — fn() navigate to Report
 *  isActive — boolean
 */
export default function PlanningSection({ activeVersion, projectId, onCreateReport, isActive }) {
  const [steps, setSteps] = useState([]);
  const [ppBotOpen, setPpBotOpen] = useState(false);
  const [ppBotMessages, setPpBotMessages] = useState([]);
  const [ppBotInput, setPpBotInput] = useState('');
  const [ppBotLoading, setPpBotLoading] = useState(false);
  const ppMsgsEndRef = useRef(null);
  const dragSrcIdRef = useRef(null);

  useEffect(() => {
    if (!isActive || !projectId) return;

    fetch(`http://localhost:3000/api/projects/${projectId}/conversations`)
      .then(response => response.json())
      .then(payload => {
        if (payload.success === false) throw new Error(payload.message || 'Unable to load planning conversation');
        const conversation = (payload.data || []).find(item => item.type === 'PLANNING');
        setPpBotMessages((conversation?.messages || []).map(message => ({
          role: message.role === 'assistant' ? 'ai' : 'user',
          text: message.content,
        })));
      })
      .catch(() => setPpBotMessages([]));
  }, [isActive, projectId]);

  useEffect(() => {
    if (ppMsgsEndRef.current) {
      ppMsgsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ppBotMessages, ppBotLoading]);

  const stepCount = steps.length;
  const stepCountLabel = stepCount === 0 ? '0 steps' : `${stepCount} step${stepCount > 1 ? 's' : ''}`;

  /* ── Step management ── */
  function addStep() {
    const id = Date.now();
    setSteps(prev => [...prev, { id, op: '', machine: '', tool: '', params: '', dur: '' }]);
  }

  function deleteStep(id) {
    setSteps(prev => prev.filter(s => s.id !== id));
  }

  function clearAllSteps() {
    setSteps([]);
  }

  function updateStepField(id, field, value) {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }

  /* ── Drag-and-drop reorder ── */
  function handleDragStart(id) {
    dragSrcIdRef.current = id;
  }

  function handleDrop(targetId) {
    const srcId = dragSrcIdRef.current;
    if (!srcId || srcId === targetId) return;
    setSteps(prev => {
      const arr = [...prev];
      const si = arr.findIndex(s => s.id === srcId);
      const di = arr.findIndex(s => s.id === targetId);
      const [moved] = arr.splice(si, 1);
      arr.splice(di, 0, moved);
      return arr;
    });
    dragSrcIdRef.current = null;
  }

  /* ── Download CSV ── */
  function downloadPlan() {
    if (steps.length === 0) return;
    const headers = ['#', 'Operation', 'Machine/Process', 'Tool/Fixture', 'Parameters', 'Duration'];
    const rows = steps.map((s, i) => [
      i + 1,
      `"${(s.op     || '').replace(/"/g, '""')}"`,
      `"${(s.machine|| '').replace(/"/g, '""')}"`,
      `"${(s.tool   || '').replace(/"/g, '""')}"`,
      `"${(s.params || '').replace(/"/g, '""')}"`,
      `"${(s.dur    || '').replace(/"/g, '""')}"`,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'process_plan.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ── PP Bot ── */
  async function sendPpBotMessage(e) {
    if (e && e.key && e.key !== 'Enter') return;
    const text = ppBotInput.trim();
    if (!text || !projectId) return;

    setPpBotMessages(prev => [...prev, { role: 'user', text }]);
    setPpBotInput('');
    setPpBotLoading(true);

    try {
      const response = await fetch(`http://localhost:3000/api/projects/${projectId}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'PLANNING', message: text }),
      });
      const payload = await response.json();
      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || 'Message could not be sent');
      }

      const messages = payload.data?.messages || [];
      const reply = messages[messages.length - 1];
      setPpBotMessages(prev => [...prev, { role: 'ai', text: reply?.content || 'No response was returned.' }]);
    } catch (error) {
      setPpBotMessages(prev => [...prev, { role: 'ai', text: `Unable to send message: ${error.message}` }]);
    } finally {
      setPpBotLoading(false);
    }
  }

  return (
    <section className={`page-section${isActive ? ' active' : ''}`} id="page-planning">

      {/* Header */}
      <div className="page-header">
        <div className="page-header__left">
          <h2 className="page-section-title">Process Planning</h2>
          <p className="page-section-sub">Define and sequence the manufacturing operations</p>
        </div>
        <div className="page-header__right">
        </div>
      </div>

      {/* ── Process Steps Panel ── */}
      <div className="pp-steps-panel">

        {/* Panel toolbar */}
        <div className="pp-panel-toolbar">
          <div className="pp-toolbar-left">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            <span className="pp-panel-title">Operations Sequence</span>
            <span className="pp-step-count" id="ppStepCount">{stepCountLabel}</span>
          </div>
          <div className="pp-toolbar-right">
            <button className="pp-btn-secondary" onClick={clearAllSteps} title="Clear all steps">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4h6v2"/>
              </svg>
              Clear
            </button>
            <button className="pp-btn-add" onClick={addStep}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Step
            </button>
          </div>
        </div>

        {/* Column headers */}
        <div className="pp-col-head">
          <span className="pp-col pp-col--drag"></span>
          <span className="pp-col pp-col--num">#</span>
          <span className="pp-col pp-col--op">Operation</span>
          <span className="pp-col pp-col--machine">Machine / Process</span>
          <span className="pp-col pp-col--tool">Tool / Fixture</span>
          <span className="pp-col pp-col--params">Parameters</span>
          <span className="pp-col pp-col--duration">Duration</span>
          <span className="pp-col pp-col--action"></span>
        </div>

        {/* Steps list */}
        <div className="pp-steps-list" id="ppStepsList">
          {/* Empty state */}
          {steps.length === 0 && (
            <div className="pp-empty-state" id="ppEmptyState">
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="3" y1="15" x2="21" y2="15"/>
                <line x1="9" y1="9" x2="9" y2="21"/>
              </svg>
              <p>No operations yet.</p>
              <span>Click <strong>Add Step</strong> to define the first manufacturing operation.</span>
            </div>
          )}

          {steps.map((step, idx) => (
            <div
              key={step.id}
              className="pp-step-row"
              draggable
              onDragStart={() => handleDragStart(step.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(step.id)}
            >
              {/* Drag handle */}
              <div className="pp-drag-handle" title="Drag to reorder">
                <DragHandle />
              </div>
              {/* Step number */}
              <span className="pp-step-num">{String(idx + 1).padStart(2, '0')}</span>
              {/* Editable cells */}
              <span
                className="pp-cell"
                contentEditable
                suppressContentEditableWarning
                data-field="op"
                data-placeholder="e.g. Rough Milling"
                onBlur={(e) => updateStepField(step.id, 'op', e.currentTarget.textContent.trim())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const cells = Array.from(e.target.closest('.pp-step-row').querySelectorAll('.pp-cell'));
                    const i = cells.indexOf(e.target);
                    if (!e.shiftKey && i === cells.length - 1) { addStep(); }
                    else if (!e.shiftKey) cells[i + 1].focus();
                    else (cells[i - 1] || cells[cells.length - 1]).focus();
                  }
                }}
              >{step.op}</span>
              <span
                className="pp-cell"
                contentEditable
                suppressContentEditableWarning
                data-field="machine"
                data-placeholder="e.g. CNC 5-Axis"
                onBlur={(e) => updateStepField(step.id, 'machine', e.currentTarget.textContent.trim())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const cells = Array.from(e.target.closest('.pp-step-row').querySelectorAll('.pp-cell'));
                    const i = cells.indexOf(e.target);
                    if (!e.shiftKey && i === cells.length - 1) { addStep(); }
                    else if (!e.shiftKey) cells[i + 1].focus();
                    else (cells[i - 1] || cells[cells.length - 1]).focus();
                  }
                }}
              >{step.machine}</span>
              <span
                className="pp-cell"
                contentEditable
                suppressContentEditableWarning
                data-field="tool"
                data-placeholder="e.g. Ø16 End Mill"
                onBlur={(e) => updateStepField(step.id, 'tool', e.currentTarget.textContent.trim())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const cells = Array.from(e.target.closest('.pp-step-row').querySelectorAll('.pp-cell'));
                    const i = cells.indexOf(e.target);
                    if (!e.shiftKey && i === cells.length - 1) { addStep(); }
                    else if (!e.shiftKey) cells[i + 1].focus();
                    else (cells[i - 1] || cells[cells.length - 1]).focus();
                  }
                }}
              >{step.tool}</span>
              <span
                className="pp-cell"
                contentEditable
                suppressContentEditableWarning
                data-field="params"
                data-placeholder="e.g. 2500 rpm, 0.2 ap"
                onBlur={(e) => updateStepField(step.id, 'params', e.currentTarget.textContent.trim())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const cells = Array.from(e.target.closest('.pp-step-row').querySelectorAll('.pp-cell'));
                    const i = cells.indexOf(e.target);
                    if (!e.shiftKey && i === cells.length - 1) { addStep(); }
                    else if (!e.shiftKey) cells[i + 1].focus();
                    else (cells[i - 1] || cells[cells.length - 1]).focus();
                  }
                }}
              >{step.params}</span>
              <span
                className="pp-cell"
                contentEditable
                suppressContentEditableWarning
                data-field="dur"
                data-placeholder="e.g. 45 min"
                onBlur={(e) => updateStepField(step.id, 'dur', e.currentTarget.textContent.trim())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const cells = Array.from(e.target.closest('.pp-step-row').querySelectorAll('.pp-cell'));
                    const i = cells.indexOf(e.target);
                    if (!e.shiftKey && i === cells.length - 1) { addStep(); }
                    else if (!e.shiftKey) cells[i + 1].focus();
                    else (cells[i - 1] || cells[cells.length - 1]).focus();
                  }
                }}
              >{step.dur}</span>
              {/* Delete */}
              <button className="pp-row-del" onClick={() => deleteStep(step.id)} title="Remove step">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          ))}
        </div>

      </div>{/* end .pp-steps-panel */}

      {/* ── Bottom row: Bot strip + Report actions ── */}
      <div className="pp-bottom-row">

        {/* Bot strip (collapsible) */}
        <div className="pp-bot-strip" id="ppBotStrip">
          <div className="pp-bot-strip-header" onClick={() => setPpBotOpen(o => !o)}>
            <div className="ext-bot-avatar" style={{ width: '24px', height: '24px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                <circle cx="12" cy="16" r="1"/>
              </svg>
            </div>
            <span className="pp-bot-label">C2P Bot</span>
            <span className="ext-bot-status" style={{ marginLeft: 'auto' }}>online</span>
            <svg
              className={`pp-bot-chevron${ppBotOpen ? ' open' : ''}`}
              id="ppBotChevron"
              width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </div>
          {ppBotOpen && (
            <div className="pp-bot-body" id="ppBotBody" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="pp-bot-messages" id="ppBotMessages">
                {ppBotMessages.map((msg, i) => (
                  <div key={i} className={`bot-msg bot-msg--${msg.role === 'ai' ? 'ai' : 'user'}`}>
                    <p>{msg.text}</p>
                  </div>
                ))}
                {ppBotLoading && <div className="bot-msg bot-msg--ai"><p>Checking the current plan and persisted context…</p></div>}
                <div ref={ppMsgsEndRef} />
              </div>
              <div className="ext-bot-input-wrap" style={{ borderTop: '1px solid var(--border-faint)' }}>
                <input
                  className="ext-bot-input"
                  id="ppBotInput"
                  type="text"
                  placeholder="Ask C2P Bot…"
                  value={ppBotInput}
                  onChange={(e) => setPpBotInput(e.target.value)}
                  onKeyDown={sendPpBotMessage}
                />
                <button className="ext-bot-send" onClick={() => sendPpBotMessage({ key: 'Enter' })}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Report actions */}
        <div className="pp-report-actions">
          <div className="pp-report-info">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span className="pp-report-info-text">Generate final report from<br />this process plan</span>
          </div>
          <div className="pp-report-btns">
            <button className="pp-btn-create-report" onClick={onCreateReport}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              Create Report
            </button>
            <button className="pp-btn-download" onClick={downloadPlan} title="Download plan as CSV">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
          </div>
        </div>

      </div>{/* end .pp-bottom-row */}

    </section>
  );
}
