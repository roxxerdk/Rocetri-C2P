import VersionDropdown from './VersionDropdown.jsx';

/*
 * Sidebar — collapsible icon rail with version selector and nav items.
 * Mirrors <aside class="sidebar"> from project.html + project.js toggleSidebar().
 *
 * Props:
 *  expanded         — boolean
 *  onToggle         — fn() toggle sidebar
 *  activePage       — 'caed' | 'extraction' | 'planning' | 'report'
 *  onSwitchPage     — fn(pageId)
 *  jobLabel         — string shown in expanded state (e.g. "JOB-001 · Bridge…")
 *  versions         — [{ label, date }]
 *  activeVersion    — string
 *  versionOpen      — boolean
 *  onVersionToggle  — fn()
 *  onVersionSelect  — fn(label)
 *  onAddVersion     — fn()
 */
export default function Sidebar({
  expanded,
  onToggle,
  activePage,
  onSwitchPage,
  jobLabel,
  versions,
  activeVersion,
  versionOpen,
  onVersionToggle,
  onVersionSelect,
  onAddVersion,
}) {
  return (
    <aside className={`sidebar${expanded ? ' expanded' : ''}`} id="sidebar">

      {/* Toggle expand button */}
      <button
        className="sidebar-toggle"
        id="sidebarToggle"
        onClick={onToggle}
        title="Expand sidebar"
      >
        {/* Hamburger (shown when collapsed) */}
        <svg className="toggle-icon-open" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
        {/* Chevron left (shown when expanded) */}
        <svg className="toggle-icon-close" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>

      {/* ── Expanded-only content ── */}
      <div className="sidebar__expanded-content">

        {/* Project label */}
        <div className="sidebar__project-label">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span>{jobLabel}</span>
        </div>

        {/* Version Selector */}
        <div className="sidebar__version">
          <div className="version-select-label">Version</div>
          <VersionDropdown
            versions={versions}
            activeVersion={activeVersion}
            isOpen={versionOpen}
            onToggle={onVersionToggle}
            onSelect={onVersionSelect}
            onAddVersion={onAddVersion}
          />
        </div>

        <div className="sidebar__divider"></div>
      </div>

      {/* ── Navigation — always visible as icons, labels on expand ── */}
      <nav className="sidebar__nav">

        <button
          className={`sidebar-nav-item${activePage === 'caed' ? ' active' : ''}`}
          onClick={() => onSwitchPage('caed')}
          title="CAED"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M3 9h18M9 21V9"/>
          </svg>
          <span className="nav-label">CAED</span>
        </button>

        <button
          className={`sidebar-nav-item${activePage === 'extraction' ? ' active' : ''}`}
          onClick={() => onSwitchPage('extraction')}
          title="Extraction & Validation"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
            <path d="M8 11h6M11 8v6"/>
          </svg>
          <span className="nav-label">Extraction &amp; Validation</span>
        </button>

        <button
          className={`sidebar-nav-item${activePage === 'planning' ? ' active' : ''}`}
          onClick={() => onSwitchPage('planning')}
          title="Process Planning"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          <span className="nav-label">Process Planning</span>
        </button>

        <button
          className={`sidebar-nav-item${activePage === 'report' ? ' active' : ''}`}
          onClick={() => onSwitchPage('report')}
          title="Report"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <span className="nav-label">Report</span>
        </button>

      </nav>
    </aside>
  );
}
