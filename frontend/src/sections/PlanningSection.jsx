import { useState, useRef, useEffect } from 'react';

export default function PlanningSection({ activeVersion, projectId, onCreateReport, isActive }) {
  // Extracted CAED context from the project
  const [extractedContext, setExtractedContext] = useState(null);
  const [contextLoading, setContextLoading] = useState(false);

  // Process plan state
  const [processPlan, setProcessPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Bot strip state
  const [ppBotOpen, setPpBotOpen] = useState(false);
  const [ppBotMessages, setPpBotMessages] = useState([]);
  const [ppBotInput, setPpBotInput] = useState('');
  const [ppBotLoading, setPpBotLoading] = useState(false);
  const ppMsgsEndRef = useRef(null);

  // Load project context and existing process plan on activation
  useEffect(() => {
    if (!isActive || !projectId) return;

    fetchExtractedContext();
    fetchCurrentPlan();
    fetchConversations();
  }, [isActive, projectId]);

  useEffect(() => {
    if (ppMsgsEndRef.current) {
      ppMsgsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ppBotMessages, ppBotLoading]);

  // ── Fetch Extracted CAD Context ──────────────────────────────────────────
  async function fetchExtractedContext() {
    setContextLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/projects/${projectId}/engineering/context`);
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setExtractedContext(json.data.contextData || json.data);
      } else {
        setExtractedContext(null);
      }
    } catch (e) {
      console.warn('Could not load extracted context:', e);
      setExtractedContext(null);
    } finally {
      setContextLoading(false);
    }
  }

  // ── Fetch Existing Process Plan ──────────────────────────────────────────
  async function fetchCurrentPlan() {
    setPlanLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/projects/${projectId}/planning/current`);
      const json = await res.json();
      if (res.ok && json.success && json.data?.planData) {
        setProcessPlan(json.data.planData);
      }
    } catch (e) {
      console.warn('No current process plan found:', e);
    } finally {
      setPlanLoading(false);
    }
  }

  // ── Fetch Planning Conversation ──────────────────────────────────────────
  async function fetchConversations() {
    try {
      const res = await fetch(`http://localhost:3000/api/projects/${projectId}/conversations`);
      const json = await res.json();
      if (res.ok && json.success) {
        const conv = (json.data || []).find(item => item.type === 'PLANNING');
        setPpBotMessages((conv?.messages || []).map(m => ({
          role: m.role === 'assistant' ? 'ai' : 'user',
          text: m.content,
        })));
      }
    } catch {}
  }

  // ── Action: Generate Process Plan ─────────────────────────────────────────
  async function handleGeneratePlan() {
    setGenerating(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`http://localhost:3000/api/projects/${projectId}/planning/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || 'Process plan generation failed');
      }

      const planData = json.data?.planData || json.data;
      setProcessPlan(planData);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to generate process plan');
    } finally {
      setGenerating(false);
    }
  }

  // ── Action: Fallback / Demo Canonical Seed ────────────────────────────────
  async function handleLoadCanonicalDemo() {
    setGenerating(true);
    setErrorMsg(null);
    try {
      const res = await fetch('http://localhost:3000/api/planning/demo/canonical-shaft');
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || 'Failed to fetch canonical shaft data');
      }

      const partInput = json.data;
      // Generate using demo planning endpoint
      const planRes = await fetch('http://localhost:3000/api/planning/demo/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partInput),
      });
      const planJson = await planRes.json();
      if (!planRes.ok || planJson.success === false) {
        throw new Error(planJson.message || 'Feature analysis failed');
      }

      const genRes = await fetch('http://localhost:3000/api/planning/demo/generate-process-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partInput: planJson.data.partInput,
          interpretation: planJson.data.interpretation,
        }),
      });
      const genJson = await genRes.json();
      if (!genRes.ok || genJson.success === false) {
        throw new Error(genJson.message || 'Process plan generation failed');
      }

      setProcessPlan(genJson.data);
      setExtractedContext({
        drawing: { partName: partInput.partName, partNumber: 'SGS-001', units: 'mm' },
        material: { name: partInput.material, standard: 'AISI', condition: 'As-Received' },
        geometry: {
          overallDimensions: [{ type: 'DIAMETER', value: '65', unit: 'mm' }, { type: 'LENGTH', value: '320', unit: 'mm' }],
          features: [
            { type: 'EXTERNAL_CYLINDER', name: 'Bearing Journal', tolerance: 'h6' },
            { type: 'KEYWAY', name: 'Torque Transmission Keyway' },
            { type: 'THREAD_EXTERNAL', name: 'Single-Point Retention Thread' },
            { type: 'CIRCLIP_GROOVE', name: 'Axial Retention Grooves' },
            { type: 'RADIAL_HOLE', name: 'Lubrication Holes' },
          ],
        },
        manufacturingNotes: { generalNotes: [partInput.description] },
      });
    } catch (err) {
      setErrorMsg(`Demo run error: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  }

  // ── Action: Export Plan JSON ──
  function handleExportJson() {
    if (!processPlan) return;
    const partTitle = extractedContext?.drawing?.partName || 'process_plan';
    const blob = new Blob([JSON.stringify(processPlan, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${partTitle.replace(/\s+/g, '_')}_process_plan.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Bot Message Sender ──
  async function sendPpBotMessage(e) {
    if (e && e.key && e.key !== 'Enter') return;
    const text = ppBotInput.trim();
    if (!text || !projectId) return;

    setPpBotMessages(prev => [...prev, { role: 'user', text }]);
    setPpBotInput('');
    setPpBotLoading(true);

    try {
      const response = await fetch(`http://localhost:3000/api/projects/${projectId}/planning/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
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

  const drawing = extractedContext?.drawing || {};
  const materialObj = extractedContext?.material || {};
  const geometry = extractedContext?.geometry || {};
  const featuresList = geometry?.features || [];
  const overallDims = geometry?.overallDimensions || [];
  const tolerancesObj = extractedContext?.tolerances || {};
  const notesList = extractedContext?.manufacturingNotes?.generalNotes || [];

  return (
    <section className={`page-section${isActive ? ' active' : ''}`} id="page-planning">
      {/* Header */}
      <div className="page-header">
        <div className="page-header__left">
          <h2 className="page-section-title">Process Planning</h2>
          <p className="page-section-sub">
            Ontology-grounded process reasoning from your extracted CAED drawing
          </p>
        </div>
        <div className="page-header__right" style={{ display: 'flex', gap: '8px' }}>
          {processPlan && (
            <button className="demo-btn-canonical" onClick={handleExportJson} title="Export Process Plan as JSON">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export JSON
            </button>
          )}
          <button
            className="demo-btn-primary"
            onClick={handleGeneratePlan}
            disabled={generating || contextLoading}
            style={{ padding: '8px 18px', fontSize: '12.5px' }}
          >
            {generating ? (
              <>
                <svg className="spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="4" strokeDasharray="30 60" />
                </svg>
                Generating Plan...
              </>
            ) : processPlan ? (
              'Regenerate Process Plan'
            ) : (
              'Generate Process Plan'
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="demo-callout demo-callout--error" style={{ marginBottom: '16px' }}>
          <strong>Error:</strong> {errorMsg}
          {!extractedContext && (
            <div style={{ marginTop: '8px' }}>
              <button
                className="demo-btn-canonical"
                onClick={handleLoadCanonicalDemo}
                style={{ fontSize: '11px', padding: '4px 10px' }}
              >
                Load Canonical Shaft Template as Sample &rarr;
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── CARD: EXTRACTED CAED DIAGRAM CONTEXT ── */}
      <div className="demo-card demo-card--primary" style={{ marginBottom: '20px' }}>
        <div className="demo-card-header">
          <div className="demo-card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span>Source CAED Drawing Data</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {extractedContext ? (
              <span className="demo-badge-pill demo-badge-pill--green">Extracted CAED Context Active</span>
            ) : (
              <button
                className="demo-btn-canonical"
                onClick={handleLoadCanonicalDemo}
                disabled={generating}
                style={{ fontSize: '11.5px', padding: '4px 10px' }}
              >
                Use Canonical Shaft Template
              </button>
            )}
          </div>
        </div>

        {contextLoading ? (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading extracted drawing context...
          </div>
        ) : extractedContext ? (
          <div>
            <div className="demo-grid-3col" style={{ marginBottom: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-faint)' }}>
                <span className="demo-label" style={{ display: 'block', marginBottom: '3px' }}>Part Identity</span>
                <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  {drawing.partName || 'Unnamed Part'}
                </strong>
                {drawing.partNumber && (
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Part #: {drawing.partNumber} ({drawing.drawingType || 'Engineering Drawing'})
                  </div>
                )}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-faint)' }}>
                <span className="demo-label" style={{ display: 'block', marginBottom: '3px' }}>Material Specification</span>
                <strong style={{ fontSize: '13px', color: '#c7d2fe' }}>
                  {materialObj.name || materialObj.grade || 'Specified on Drawing'}
                </strong>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Standard: {materialObj.standard || 'AISI / ISO'} | Condition: {materialObj.condition || 'As-received'}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-faint)' }}>
                <span className="demo-label" style={{ display: 'block', marginBottom: '3px' }}>Overall Stock &amp; Dimensions</span>
                <strong style={{ fontSize: '13px', color: '#fed7aa' }}>
                  {overallDims.length > 0
                    ? overallDims.map((d) => `${d.type || d.dimensionType || ''}: ${d.value || d.nominal || ''}${d.unit || 'mm'}`).join(' × ')
                    : 'From CAD Geometry'}
                </strong>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Tolerance: {tolerancesObj.generalTolerance?.value || 'Standard Shop Tolerance'}
                </div>
              </div>
            </div>

            {/* Extracted Features List */}
            {featuresList.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <span className="demo-label" style={{ display: 'block', marginBottom: '6px' }}>
                  Detected Manufacturing Features ({featuresList.length})
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {featuresList.slice(0, 10).map((f, i) => (
                    <span key={i} className="demo-badge-pill demo-badge-pill--blue" style={{ fontSize: '11px' }}>
                      {f.name || f.type || `Feature ${i + 1}`}
                      {f.tolerance ? ` (${f.tolerance})` : f.nominal ? ` [${f.nominal}]` : ''}
                    </span>
                  ))}
                  {featuresList.length > 10 && (
                    <span className="demo-badge-pill" style={{ fontSize: '11px' }}>
                      +{featuresList.length - 10} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '14px', background: 'rgba(234, 179, 8, 0.05)', borderRadius: '6px', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
            <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#fde047' }}>
              No CAED diagram extracted yet for this project.
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
              Go to the <strong>Extraction</strong> section to upload and verify a CAD drawing, or click below to run the process planning engine using the canonical Stepped Gearbox Shaft pattern.
            </p>
            <div style={{ marginTop: '10px' }}>
              <button className="demo-btn-canonical" onClick={handleLoadCanonicalDemo} disabled={generating}>
                Load Canonical Shaft Template &amp; Run Planning &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── CARD: GENERATED PROCESS PLAN (AI OUTPUT) ── */}
      {planLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading saved process plan...
        </div>
      ) : processPlan ? (
        <div className="demo-card" style={{ marginBottom: '20px', borderTop: '3px solid #6366f1' }}>
          <div className="demo-card-header">
            <div className="demo-card-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span>Manufacturing Process Plan</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="demo-badge-pill demo-badge-pill--green">
                {(processPlan.setups || []).length} Setups Planned
              </span>
            </div>
          </div>

          {/* DYNAMIC VISUAL PROCESS FLOW */}
          <div style={{ marginBottom: '16px' }}>
            <span className="demo-label" style={{ marginBottom: '6px', display: 'block' }}>
              Dynamic State &amp; Setup Sequence Flow
            </span>
            <div className="demo-flow-container">
              <div className="demo-flow-node demo-flow-node--raw">
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Input State</span>
                <strong style={{ fontSize: '13px', color: '#e2e8f0' }}>RAW MATERIAL</strong>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {drawing.partName || 'Stock Bar'}
                </span>
              </div>

              {(processPlan.setups || []).map((s, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="demo-flow-arrow">&rarr;</div>
                  <div className="demo-flow-node demo-flow-node--setup">
                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                      Setup {s.sequence}
                    </span>
                    <strong style={{ fontSize: '12.5px', color: '#c7d2fe' }}>
                      {s.machineRequirement?.category || 'CNC SETUP'}
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {s.operations?.length || 0} Ops
                    </span>
                  </div>
                </div>
              ))}

              {processPlan.heatTreatment?.length > 0 && (
                <>
                  <div className="demo-flow-arrow">&rarr;</div>
                  <div className="demo-flow-node demo-flow-node--ht">
                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Thermal Process</span>
                    <strong style={{ fontSize: '12.5px', color: '#fde68a' }}>HEAT TREATMENT</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {processPlan.heatTreatment[0]?.type || 'Hardening'}
                    </span>
                  </div>
                </>
              )}

              <div className="demo-flow-arrow">&rarr;</div>
              <div className="demo-flow-node demo-flow-node--finish">
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Final State</span>
                <strong style={{ fontSize: '13px', color: '#a7f3d0' }}>PRECISION FINISHED</strong>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Verified &amp; Inspected</span>
              </div>
            </div>
          </div>

          {/* Strategy Summary */}
          {processPlan.planningSummary && (
            <div style={{ padding: '12px 16px', background: 'rgba(99,102,241,0.06)', borderRadius: '6px', border: '1px solid rgba(99,102,241,0.2)', marginBottom: '18px' }}>
              <span className="demo-label" style={{ color: '#818cf8', marginBottom: '4px', display: 'block' }}>Process Strategy Summary</span>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                {processPlan.planningSummary}
              </p>
            </div>
          )}

          {/* Setups and Operations */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {(processPlan.setups || []).map((setup, sIdx) => (
              <div
                key={sIdx}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '8px',
                  padding: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="demo-step-badge" style={{ background: '#4f46e5' }}>{setup.sequence}</span>
                    <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>{setup.setupPurpose}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span className="demo-badge-pill demo-badge-pill--purple">
                      Machine Req: {setup.machineRequirement?.category || 'Any CNC'}
                    </span>
                    <span className="demo-badge-pill demo-badge-pill--yellow">
                      Workholding: {setup.workholdingRequirement?.type || 'Standard Fixture'}
                    </span>
                  </div>
                </div>

                <div className="demo-table-wrap">
                  <table className="demo-table">
                    <thead>
                      <tr>
                        <th style={{ width: '35px' }}>#</th>
                        <th>Operation</th>
                        <th>Process Family / Stage</th>
                        <th>Target Features</th>
                        <th>State Transition</th>
                        <th>Tooling Req.</th>
                        <th>Inspection / QC</th>
                        <th>Engineering Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(setup.operations || []).map((op, oIdx) => (
                        <tr key={oIdx}>
                          <td><strong>{op.sequence}</strong></td>
                          <td><strong>{op.operationName}</strong></td>
                          <td>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              <span className="demo-badge-pill demo-badge-pill--blue">{op.processFamily}</span>
                              <span className="demo-badge-pill demo-badge-pill--green">{op.processStage}</span>
                            </div>
                          </td>
                          <td>
                            {(op.targetFeatures || []).map((t, ti) => (
                              <span key={ti} className="demo-badge-pill" style={{ marginRight: '4px' }}>{t}</span>
                            ))}
                          </td>
                          <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {op.inputState} &rarr; {op.outputState}
                          </td>
                          <td style={{ fontSize: '11px' }}>
                            {op.toolRequirement?.category || op.toolRequirement?.material || 'Standard Tooling'}
                          </td>
                          <td style={{ fontSize: '11px' }}>
                            {op.measurementRequirement?.instrument || (op.measurementRequirement?.postOperation ? 'Post-Op Check' : 'Visual')}
                          </td>
                          <td style={{ fontSize: '11px', color: 'var(--text-secondary)', maxWidth: '240px' }}>
                            {op.reason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {/* Thermal Processing & Quality Checkpoints */}
          {(processPlan.heatTreatment?.length > 0 || processPlan.qualityCheckpoints?.length > 0) && (
            <div className="demo-grid-2col" style={{ marginTop: '16px' }}>
              {processPlan.heatTreatment?.length > 0 && (
                <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', padding: '12px', borderRadius: '6px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#fbbf24', textTransform: 'uppercase' }}>
                    Thermal Processing (Heat Treatment)
                  </h4>
                  {processPlan.heatTreatment.map((ht, i) => (
                    <div key={i} style={{ fontSize: '12px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      <strong>{ht.type}</strong> — Distortion Risk: <span style={{ color: '#f87171' }}>{ht.distortionRisk || 'MEDIUM'}</span>
                      {ht.timing && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Timing: {ht.timing}</div>}
                    </div>
                  ))}
                </div>
              )}

              {processPlan.qualityCheckpoints?.length > 0 && (
                <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', padding: '12px', borderRadius: '6px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#34d399', textTransform: 'uppercase' }}>
                    Quality Assurance Checkpoints
                  </h4>
                  {processPlan.qualityCheckpoints.map((qc, i) => (
                    <div key={i} style={{ fontSize: '12px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      <strong>{qc.triggerStage || 'Final Inspection'}</strong>: {qc.inspectionMethod || qc.acceptanceCriteria}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Process Warnings & Assumptions */}
          {(processPlan.warnings?.length > 0 || processPlan.assumptions?.length > 0) && (
            <div className="demo-grid-2col" style={{ marginTop: '14px' }}>
              {processPlan.warnings?.length > 0 && (
                <div className="demo-callout demo-callout--warn">
                  <strong>Process Warnings / Risks:</strong>
                  <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                    {processPlan.warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}
              {processPlan.assumptions?.length > 0 && (
                <div className="demo-callout demo-callout--info">
                  <strong>Process Assumptions:</strong>
                  <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                    {processPlan.assumptions.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* ── Bottom row: Bot strip + Report actions ── */}
      <div className="pp-bottom-row">
        {/* Bot strip (collapsible) */}
        <div className="pp-bot-strip" id="ppBotStrip">
          <div className="pp-bot-strip-header" onClick={() => setPpBotOpen(o => !o)}>
            <div className="ext-bot-avatar" style={{ width: '24px', height: '24px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                <circle cx="12" cy="16" r="1"/>
              </svg>
            </div>
            <span className="pp-bot-label">C2P Planning Assistant</span>
            <span className="ext-bot-status" style={{ marginLeft: 'auto' }}>online</span>
            <svg
              className={`pp-bot-chevron${ppBotOpen ? ' open' : ''}`}
              width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5"
            >
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </div>
          {ppBotOpen && (
            <div className="pp-bot-body" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="pp-bot-messages">
                {ppBotMessages.map((msg, i) => (
                  <div key={i} className={`bot-msg bot-msg--${msg.role === 'ai' ? 'ai' : 'user'}`}>
                    <p>{msg.text}</p>
                  </div>
                ))}
                {ppBotLoading && <div className="bot-msg bot-msg--ai"><p>Consulting manufacturing ontology...</p></div>}
                <div ref={ppMsgsEndRef} />
              </div>
              <div className="ext-bot-input-wrap" style={{ borderTop: '1px solid var(--border-faint)' }}>
                <input
                  className="ext-bot-input"
                  type="text"
                  placeholder="Ask C2P Bot about setups, tooling, or GD&amp;T..."
                  value={ppBotInput}
                  onChange={(e) => setPpBotInput(e.target.value)}
                  onKeyDown={sendPpBotMessage}
                />
                <button className="ext-bot-send" onClick={() => sendPpBotMessage({ key: 'Enter' })}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span className="pp-report-info-text">Ready to finalize?<br />Generate manufacturing report</span>
          </div>
          <div className="pp-report-btns">
            <button className="pp-btn-create-report" onClick={onCreateReport}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              Proceed to Report
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
