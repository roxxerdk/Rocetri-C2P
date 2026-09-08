import { Link } from 'react-router-dom';

/* ─── Status icon + class mapping ───
 * Maps primaryWorkflowStage values to visual indicators.
 * Only uses real data values — no invented states.
 */
function getStatusMeta(meta) {
  const raw = (meta || '').toLowerCase();

  if (!meta || raw === 'ready' || raw === 'created') {
    return {
      label: meta || 'READY',
      cls: 'job-status--ready',
      icon: (
        /* Circle outline — neutral/awaiting */
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
        </svg>
      ),
    };
  }

  if (raw.includes('extract') || raw.includes('analys') || raw.includes('plan')) {
    return {
      label: meta,
      cls: 'job-status--active',
      icon: (
        /* Pulsing-style indicator — in-progress */
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3" fill="currentColor" />
          <circle cx="12" cy="12" r="7" />
        </svg>
      ),
    };
  }

  if (raw.includes('complete') || raw.includes('done') || raw.includes('finish')) {
    return {
      label: meta,
      cls: 'job-status--complete',
      icon: (
        /* Checkmark — completed */
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    };
  }

  if (raw.includes('error') || raw.includes('fail') || raw.includes('invalid')) {
    return {
      label: meta,
      cls: 'job-status--error',
      icon: (
        /* Warning triangle — error */
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      ),
    };
  }

  /* Fallback — treat as active/in-progress */
  return {
    label: meta,
    cls: 'job-status--active',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3" fill="currentColor" />
        <circle cx="12" cy="12" r="7" />
      </svg>
    ),
  };
}

/* Arrow for open action */
function ArrowIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  );
}

/*
 * JobCard — engineering job record card.
 * Uses React Router <Link> for SPA navigation.
 * All props come from real API data — no fake values.
 */
export default function JobCard({ id, name, meta, versions, date }) {
  const params = new URLSearchParams({
    id,
    name,
    versions: versions.join(','),
    date,
  });

  const { label: statusLabel, cls: statusCls, icon: statusIcon } = getStatusMeta(meta);

  /* Truncate the id for display — keep it readable */
  const shortId = id ? id.slice(-8).toUpperCase() : '—';

  return (
    <Link
      className="job-card"
      to={`/project?${params.toString()}`}
      aria-label={`Open engineering job: ${name}`}
    >
      {/* Status row */}
      <div className="job-card__header">
        <span className={`job-status ${statusCls}`} title={`Status: ${statusLabel}`}>
          <span className="job-status__icon">{statusIcon}</span>
          {statusLabel}
        </span>
      </div>

      {/* Eyebrow label */}
      <div className="job-card__eyebrow" aria-hidden="true">Engineering Job</div>

      {/* Primary: project name */}
      <h3 className="job-card__title">{name}</h3>

      {/* Technical metadata */}
      <div className="job-card__meta-block">
        <div className="job-card__meta-item">
          <span>Job ID</span>
          <strong title={id}>#{shortId}</strong>
        </div>
        {date && date !== '—' && (
          <div className="job-card__meta-item">
            <span>Created</span>
            <strong>{date}</strong>
          </div>
        )}
      </div>

      {/* Version tags */}
      {versions.length > 0 && (
        <div className="version-row" aria-label="Versions">
          {versions.map((v) => (
            <span key={v} className="version-tag">{v}</span>
          ))}
        </div>
      )}

      {/* Footer — open action only */}
      <div className="job-card__footer">
        <span className="job-card__action" aria-hidden="true">
          Open Job
          <span className="icon-btn">
            <ArrowIcon />
          </span>
        </span>
      </div>
    </Link>
  );
}
