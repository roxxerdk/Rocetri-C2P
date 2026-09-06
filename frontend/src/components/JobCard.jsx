import { Link } from 'react-router-dom';

/* Calendar SVG used in card footer date */
function CalendarIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

/* Arrow SVG used in card footer */
function ArrowIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  );
}

/*
 * JobCard — renders a single job card on the dashboard.
 * Uses React Router <Link> instead of <a href="project.html?...">
 * so navigation preserves SPA behaviour.
 */
export default function JobCard({ id, name, meta, versions, date }) {
  const params = new URLSearchParams({
    id,
    name,
    versions: versions.join(','),
    date,
  });

  return (
    <Link className="job-card" to={`/project?${params.toString()}`}>
      <div className="job-card__header">
        <span className="job-id">{id}</span>
      </div>
      <h3 className="job-card__title">{name}</h3>
      <p className="job-card__meta">{meta}</p>
      <div className="version-row">
        {versions.length > 0 ? (
          versions.map((v) => (
            <span key={v} className="version-tag">{v}</span>
          ))
        ) : (
          <span className="version-empty">No versions yet</span>
        )}
      </div>
      <div className="job-card__footer">
        <span className="job-card__date">
          <CalendarIcon />
          {date}
        </span>
        <span className="icon-btn">
          <ArrowIcon />
        </span>
      </div>
    </Link>
  );
}
