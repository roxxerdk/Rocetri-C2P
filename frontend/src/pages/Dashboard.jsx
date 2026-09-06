import Navbar from '../components/Navbar.jsx';
import JobCard from '../components/JobCard.jsx';

/* Static job data — mirrors the 5 cards in index.html exactly */
const JOBS = [
  {
    id: 'JOB-001',
    name: 'Bridge Structure Analysis',
    meta: 'C2P Extraction · CAED File',
    versions: ['v1', 'v2', 'v3'],
    date: '12 Aug 2026',
  },
  {
    id: 'JOB-002',
    name: 'Tunnel Load Validation',
    meta: 'C2P Extraction · CAED File',
    versions: ['v1', 'v2'],
    date: '05 Sep 2026',
  },
  {
    id: 'JOB-003',
    name: 'Retaining Wall Report',
    meta: 'C2P Extraction · CAED File',
    versions: ['v1'],
    date: '04 Sep 2026',
  },
  {
    id: 'JOB-004',
    name: 'Foundation Design Check',
    meta: 'C2P Extraction · CAED File',
    versions: ['v1', 'v2', 'v3'],
    date: '01 Sep 2026',
  },
  {
    id: 'JOB-005',
    name: 'Slope Stability Review',
    meta: 'C2P Extraction · CAED File',
    versions: [],
    date: '06 Sep 2026',
  },
];

export default function Dashboard() {
  return (
    <div className="app-shell">
      {/* ══════════════════════════════════════
           BACKGROUND NOISE LAYER
      ══════════════════════════════════════ */}
      <div className="bg-layer" aria-hidden="true"></div>

      {/* ─── TOP NAVBAR ─── */}
      <Navbar />

      {/* ─── PAGE BODY ─── */}
      <main className="page-body">

        {/* FLOATING DASHBOARD PANEL */}
        <div className="dashboard-panel">

          {/* ─── SUB-HEADER ─── */}
          <section className="sub-header">
            <div className="sub-header__left">
              <h1 className="page-title">Dashboard</h1>
              <p className="page-subtitle">Manage and track all your C2P jobs</p>
            </div>
            <div className="sub-header__right">
              <button className="btn btn--ghost">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                Search
              </button>
              <button className="btn btn--primary">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                New Job
              </button>
            </div>
          </section>

          {/* DIVIDER */}
          <div className="panel-divider"></div>

          {/* ─── JOB GRID ─── */}
          <section className="job-grid">
            {JOBS.map((job) => (
              <JobCard key={job.id} {...job} />
            ))}

            {/* ADD NEW CARD */}
            <article className="job-card job-card--add">
              <div className="add-card-inner">
                <div className="add-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </div>
                <span className="add-card-label">New Job</span>
              </div>
            </article>
          </section>

        </div>{/* end .dashboard-panel */}

      </main>
    </div>
  );
}
