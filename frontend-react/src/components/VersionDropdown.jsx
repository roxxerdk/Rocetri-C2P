import { useRef, useEffect } from 'react';

/*
 * VersionDropdown — replicates the fixed-position version menu from project.js.
 *
 * The original uses position:fixed + getBoundingClientRect() to escape the
 * sidebar's overflow:hidden. We replicate that exactly using useRef on the
 * trigger button and computing menu position on open.
 */
export default function VersionDropdown({
  versions,
  activeVersion,
  isOpen,
  onToggle,
  onSelect,
  onAddVersion,
}) {
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  /* Position the fixed menu under the trigger whenever it opens */
  useEffect(() => {
    if (isOpen && triggerRef.current && menuRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      menuRef.current.style.top = (rect.bottom + 6) + 'px';
      menuRef.current.style.left = rect.left + 'px';
      menuRef.current.style.width = rect.width + 'px';
    }
  }, [isOpen]);

  /* Close on outside click — mirrors the original closeDropdownOutside */
  useEffect(() => {
    if (!isOpen) return;
    function handleOutside(e) {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) {
        onToggle(); // close
      }
    }
    const id = setTimeout(() => {
      document.addEventListener('click', handleOutside, { once: true });
    }, 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('click', handleOutside);
    };
  }, [isOpen, onToggle]);

  return (
    <div className={`version-dropdown${isOpen ? ' open' : ''}`} id="versionDropdown">
      <button
        ref={triggerRef}
        className="version-dropdown__trigger"
        onClick={onToggle}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        <span id="activeVersionLabel">{activeVersion}</span>
        <svg className="dd-chevron" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Menu is rendered outside via portal-like fixed positioning */}
      <div
        ref={menuRef}
        className="version-dropdown__menu"
        id="versionMenu"
      >
        {versions.map((ver, i) => (
          <button
            key={ver.label}
            className={`version-option${i === 0 && activeVersion === ver.label ? ' active' : activeVersion === ver.label ? ' active' : ''}`}
            onClick={() => onSelect(ver.label)}
          >
            <span className="vo-label">{ver.label}</span>
            <span className="vo-date">{ver.date}</span>
          </button>
        ))}
        <div className="version-menu-divider"></div>
        <button className="version-option version-option--add" onClick={onAddVersion}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span className="vo-label">Add New Version</span>
        </button>
      </div>
    </div>
  );
}
