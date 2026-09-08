import { useEffect, useState } from 'react';

/*
 * DatetimeFloat — the fixed top-right floating date/time panel.
 * Mirrors project.js updateDateTime() + tickClock().
 *
 * Props:
 *  lastUpdate — Date object (updated when file is uploaded / version changes)
 */
export default function DatetimeFloat({ lastUpdate }) {
  const [dateStr, setDateStr] = useState('—');
  const [timeStr, setTimeStr] = useState('—');

  useEffect(() => {
    if (!lastUpdate) return;

    function format(d) {
      const ds = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const ts = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setDateStr(ds);
      setTimeStr(ts);
    }

    format(lastUpdate);

    // Tick every second (mirrors tickClock — only updates if < 60s ago)
    const interval = setInterval(() => {
      const now = new Date();
      const diff = now - lastUpdate;
      if (diff < 60000) {
        setTimeStr(lastUpdate.toLocaleTimeString('en-GB', {
          hour: '2-digit', minute: '2-digit', second: '2-digit',
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastUpdate]);

  return (
    <div
      className={`datetime-float${lastUpdate ? ' visible' : ''}`}
      id="datetimeFloat"
      aria-live="polite"
      aria-label="Last updated date and time"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="17" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
      </svg>
      <div className="datetime-float__content">
        <span className="datetime-float__date" id="floatDate">{dateStr}</span>
        <span className="datetime-float__time" id="floatTime">{timeStr}</span>
      </div>
      <div className="datetime-float__update-label">Last updated</div>
    </div>
  );
}
