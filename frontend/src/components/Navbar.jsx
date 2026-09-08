import C2PLogo from './C2PLogo.jsx';

/* Top navbar — shared between Dashboard and Project pages */
export default function Navbar() {
  return (
    <header className="navbar" role="banner">
      {/* C2P LOGO */}
      <div className="navbar__brand">
        <C2PLogo />
      </div>

      {/* NAV LINKS */}
      <nav className="navbar__links" aria-label="Main navigation"></nav>

      {/* ENGINEERING SYSTEM LABEL — center */}
      <div className="navbar__center" aria-hidden="true">
        <span className="navbar__system-label">CAD → PROCESS PLANNING SYSTEM</span>
      </div>

      {/* USER */}
      <div className="navbar__right">
        <div className="user-avatar" role="button" tabIndex={0} aria-label="User profile" title="User Profile">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span className="user-avatar__label">Engineer</span>
          <svg className="chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
    </header>
  );
}
