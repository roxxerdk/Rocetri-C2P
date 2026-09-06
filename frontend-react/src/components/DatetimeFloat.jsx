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
    <div className="datetime-float" id="datetimeFloat">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
      <div className="datetime-float__content">
        <span className="datetime-float__date" id="floatDate">{dateStr}</span>
        <span className="datetime-float__time" id="floatTime">{timeStr}</span>
      </div>
      <div className="datetime-float__update-label">Last update</div>
    </div>
  );
}
