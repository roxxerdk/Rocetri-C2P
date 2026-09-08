import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Sidebar from '../components/Sidebar.jsx';
import DatetimeFloat from '../components/DatetimeFloat.jsx';
import CaedSection from '../sections/CaedSection.jsx';
import ExtractionSection from '../sections/ExtractionSection.jsx';
import PlanningSection from '../sections/PlanningSection.jsx';
import ReportSection from '../sections/ReportSection.jsx';

/*
 * Project page — mirrors project.html.
 *
 * Reads job data from URL search params (?id=...&name=...&versions=...&date=...)
 * exactly as project.js DOMContentLoaded does.
 *
 * State managed here (lifted up so sub-sections can cross-navigate):
 *  - sidebarExpanded
 *  - versionOpen / activeVersion / versions array
 *  - activePage (caed | extraction | planning | report)
 *  - lastUpdate (Date) for the floating datetime panel
 *  - autoGenerateReport flag (Planning → Report handoff)
 */
export default function Project() {
  const [searchParams] = useSearchParams();

  /* ── Read URL params (mirrors project.js DOMContentLoaded) ── */
  const jobId       = searchParams.get('id')       || 'JOB-001';
  const jobName     = searchParams.get('name')     || 'Bridge Structure Analysis';
  const versionsRaw = searchParams.get('versions') || 'v1';
  const jobDate     = searchParams.get('date')     || '';

  const jobLabel = `${jobId} · ${jobName}`;

  /* Build initial versions list — mirrors the URL-driven version building in project.js */
  const initialVersions = versionsRaw
    ? versionsRaw.split(',').map(v => v.trim()).filter(Boolean).map(v => ({ label: v, date: jobDate }))
    : [];

  /* ── Sidebar ── */
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  /* ── Versions ── */
  const [versions, setVersions] = useState(initialVersions);
  const [activeVersion, setActiveVersion] = useState(
    initialVersions.length > 0 ? initialVersions[0].label : '—'
  );
  const [versionOpen, setVersionOpen] = useState(false);

  /* ── Active page/tab ── */
  const [activePage, setActivePage] = useState('caed');

  /* ── Floating datetime ── */
  const [lastUpdate, setLastUpdate] = useState(null);
  const [extractedContext, setExtractedContext] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  useEffect(() => {
    const savedFile = window.localStorage.getItem(`c2p-upload-${jobId}`);
    if (!savedFile) return;
    try {
      setUploadedFile(JSON.parse(savedFile));
    } catch {
      window.localStorage.removeItem(`c2p-upload-${jobId}`);
    }
  }, [jobId]);

  function handleFileSelected(file) {
    setUploadedFile(file);
    window.localStorage.setItem(`c2p-upload-${jobId}`, JSON.stringify(file));
  }

  /* ── Report auto-generate flag (set when Planning calls createReport) ── */
  const [autoGenerateReport, setAutoGenerateReport] = useState(false);

  /* Update document title to reflect job */
  useEffect(() => {
    document.title = `C2P — ${jobName}`;
    return () => { document.title = 'C2P'; };
  }, [jobName]);

  /* ── Version handlers ── */
  function handleVersionSelect(label) {
    setActiveVersion(label);
    setVersionOpen(false);
    setLastUpdate(new Date()); // mirrors selectVersion → updateDateTime
  }

  function handleAddVersion() {
    setVersionOpen(false);
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const newLabel = `v${versions.length + 1}`;
    const newVer = { label: newLabel, date: dateStr };
    setVersions(prev => [...prev, newVer]);
    setActiveVersion(newLabel);
    setLastUpdate(now);
  }

  /* ── Navigation from Planning → Report ── */
  function handleCreateReport() {
    setActivePage('report');
    setAutoGenerateReport(true);
  }

  return (
    <>
      {/* ══════════════════════════════════════
           TOP NAVBAR (shared with dashboard)
      ══════════════════════════════════════ */}
      <Navbar />

      {/* ══════════════════════════════════════
           PROJECT PAGE SHELL
      ══════════════════════════════════════ */}
      <div className="project-shell">

        {/* ═══ SIDEBAR ═══ */}
        <Sidebar
          expanded={sidebarExpanded}
          onToggle={() => { setSidebarExpanded(e => !e); setLastUpdate(new Date()); }}
          activePage={activePage}
          onSwitchPage={(page) => { setActivePage(page); setLastUpdate(new Date()); }}
          jobLabel={jobLabel}
          versions={versions}
          activeVersion={activeVersion}
          versionOpen={versionOpen}
          onVersionToggle={() => setVersionOpen(o => !o)}
          onVersionSelect={handleVersionSelect}
          onAddVersion={handleAddVersion}
        />

        {/* ═══ MAIN CONTENT AREA ═══ */}
        <main className="project-main">

          {/* ─── FLOATING DATE-TIME ─── */}
          <DatetimeFloat lastUpdate={lastUpdate} />

          {/* ════ PAGE: CAED (default) ════ */}
          {activePage === 'caed' && (
            <CaedSection
              activeVersion={activeVersion}
              projectId={jobId}
              uploadedFile={uploadedFile}
              onFileSelected={handleFileSelected}
              onFileUploaded={(date) => setLastUpdate(date)}
              onExtractionComplete={(result) => {
                setExtractedContext(result.context);
                setActivePage('extraction');
              }}
            />
          )}

          {/* ════ PAGE: EXTRACTION & VALIDATION ════ */}
          {activePage === 'extraction' && (
            <ExtractionSection
              activeVersion={activeVersion}
              projectId={jobId}
              uploadedFile={uploadedFile}
              context={extractedContext}
              onConfirm={() => setActivePage('planning')}
              isActive={true}
            />
          )}

          {/* ════ PAGE: PROCESS PLANNING ════ */}
          {activePage === 'planning' && (
            <PlanningSection
              activeVersion={activeVersion}
              projectId={jobId}
              onCreateReport={handleCreateReport}
              isActive={true}
            />
          )}

          {/* ════ PAGE: REPORT ════ */}
          {activePage === 'report' && (
            <ReportSection
              projectId={jobId}
              activeVersion={activeVersion}
              isActive={true}
              autoGenerate={autoGenerateReport}
              onAutoGenerateDone={() => setAutoGenerateReport(false)}
            />
          )}

        </main>
      </div>
    </>
  );
}
