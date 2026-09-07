import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import JobCard from '../components/JobCard.jsx';

const API = 'http://localhost:3000/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

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
    date: project.createdAt ? new Date(project.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
  }));

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
              <button className="btn btn--primary" onClick={createJob}>
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
            {loading && <div className="ui-loading"><span className="ui-spinner"></span><span>Loading projects</span></div>}
            {!loading && jobCards.map((job) => (
              <JobCard key={job.id} {...job} />
            ))}

            {/* ADD NEW CARD */}
            <article className="job-card job-card--add" onClick={createJob}>
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
