import C2PLogo from './C2PLogo.jsx';

/* Top navbar — shared between Dashboard and Project pages */
export default function Navbar() {
  return (
    <header className="navbar">
      {/* C2P LOGO */}
      <div className="navbar__brand">
        <C2PLogo />
      </div>

      {/* NAV LINKS (empty in original) */}
      <nav className="navbar__links"></nav>

      {/* USER */}
      <div className="navbar__right">
        <div className="user-avatar" title="User Profile">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span className="user-avatar__label">User</span>
          <svg className="chevron" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
    </header>
  );
}
