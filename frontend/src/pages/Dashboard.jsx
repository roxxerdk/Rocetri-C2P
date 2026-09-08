import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import JobCard from '../components/JobCard.jsx';

const API = 'http://localhost:3000/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch(`${API}/projects`)
      .then((response) => response.json())
      .then((payload) => setJobs(payload.success ? payload.data : []))
      .finally(() => setLoading(false));
  }, []);

  async function createJob() {
    const name = window.prompt('Project name:');
    if (!name?.trim()) return;
    const response = await fetch(`${API}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectName: name.trim() }),
    });
    const payload = await response.json();
    if (payload.success && payload.data?._id) navigate(`/project?id=${payload.data._id}`);
  }

  const jobCards = jobs.map((project) => ({
    id: project._id,
    name: project.projectName,
    meta: project.primaryWorkflowStage,
    versions: [],
    date: project.createdAt
      ? new Date(project.createdAt).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '—',
  }));

  /* Client-side filter — no API change */
  const filteredCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return jobCards;
    return jobCards.filter(
      (j) =>
        j.name?.toLowerCase().includes(q) ||
        j.id?.toLowerCase().includes(q) ||
        j.meta?.toLowerCase().includes(q),
    );
  }, [jobCards, searchQuery]);

  const showEmpty = !loading && jobCards.length === 0;
  const showNoResults = !loading && jobCards.length > 0 && filteredCards.length === 0;

  return (
    <div className="app-shell">
      {/* Engineering grid overlay */}
      <div className="bg-layer" aria-hidden="true"></div>

      <Navbar />

      <main className="page-body">
        <div className="dashboard-panel">

          {/* ── WORKSPACE HEADER ── */}
          <section className="workspace-header">
            <div className="workspace-header__content">
              <span className="workspace-kicker" aria-label="System: C2P">C2P</span>
              <h1 className="page-title">Digital Manufacturing Workspace</h1>
            </div>
            <div className="sub-header__right">
              <button
                className="btn btn--primary"
                onClick={createJob}
                type="button"
                aria-label="Create a new engineering job"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New Engineering Job
              </button>
            </div>
          </section>

          <div className="panel-divider"></div>

          {/* ── WORKFLOW INDICATOR ── */}
          <section className="workspace-strip" aria-label="C2P engineering workflow">
            <span className="workspace-strip__label">Engineering Jobs</span>
            <div className="workspace-strip__flow" aria-hidden="true">
              <span className="flow-step">CAD</span>
              <span className="flow-separator">→</span>
              <span className="flow-step">Extraction</span>
              <span className="flow-separator">→</span>
              <span className="flow-step">Analysis</span>
              <span className="flow-separator">→</span>
              <span className="flow-step">Process Plan</span>
            </div>
          </section>

          {/* ── SEARCH ROW ── */}
          <div className="search-row">
            <div className="search-bar" role="search">
              <svg
                className="search-bar__icon"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className="search-input"
                type="search"
                placeholder="SEARCH JOBS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search engineering jobs"
                spellCheck={false}
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  className="search-clear"
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
            {!loading && jobCards.length > 0 && (
              <span className="search-results-count" aria-live="polite" aria-label={`${filteredCards.length} of ${jobCards.length} jobs`}>
                {searchQuery
                  ? `${filteredCards.length} / ${jobCards.length} JOBS`
                  : `${jobCards.length} JOB${jobCards.length !== 1 ? 'S' : ''}`
                }
              </span>
            )}
          </div>

          {/* ── JOB GRID ── */}
          <section className="job-grid" aria-label="Engineering jobs">

            {/* Loading state */}
            {loading && (
              <div className="ui-loading" aria-live="polite">
                <span className="ui-spinner" aria-hidden="true"></span>
                <span>Loading Jobs...</span>
              </div>
            )}

            {/* No jobs empty state */}
            {showEmpty && (
              <div className="empty-state" role="status">
                <div className="empty-state__icon" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M3 9h18M9 21V9"/>
                  </svg>
                </div>
                <p className="empty-state__title">No Engineering Jobs</p>
                <p className="empty-state__sub">Create your first job to begin the CAD→Process Plan workflow.</p>
                <button className="btn btn--primary" onClick={createJob} type="button">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  New Engineering Job
                </button>
              </div>
            )}

            {/* No search results */}
            {showNoResults && (
              <div className="empty-state" role="status">
                <div className="empty-state__icon" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </div>
                <p className="empty-state__title">No matches found</p>
                <p className="empty-state__sub">No jobs match &ldquo;{searchQuery}&rdquo;. Try a different search term.</p>
              </div>
            )}

            {/* Filtered job cards */}
            {!loading && filteredCards.map((job) => (
              <JobCard key={job.id} {...job} />
            ))}

            {/* Add new card — only visible when not actively searching */}
            {!loading && !searchQuery && (
              <article
                className="job-card job-card--add"
                onClick={createJob}
                role="button"
                tabIndex={0}
                aria-label="Create a new engineering job"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    createJob();
                  }
                }}
              >
                <div className="add-card-inner">
                  <div className="add-icon" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </div>
                  <span className="add-card-label">New Engineering Job</span>
                </div>
              </article>
            )}

          </section>
        </div>
      </main>
    </div>
  );
}
