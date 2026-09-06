/* ═══════════════════════════════════════════════════════════════
   REPORT PAGE LOGIC
═══════════════════════════════════════════════════════════════ */

let reports = [];
let rpCounter = 0;

// ─── Generate a new report entry ─────────────────────────────
function generateReport() {
  rpCounter++;
  const now = new Date();
  const id = Date.now();

  const report = {
    id,
    name: `Report ${rpCounter}`,
    date: formatRpDate(now),
    status: 'generating',
    size: '—',
  };

  reports.unshift(report); // newest on top
  renderReports();

  // Simulate generation: 1.8s → final
  setTimeout(() => {
    const r = reports.find(x => x.id === id);
    if (r) {
      r.status = 'final';
      r.size = randomSize();
      renderReports();
    }
  }, 1800);
}

// ─── Render list ─────────────────────────────────────────────
function renderReports() {
  const body  = document.getElementById('rpListBody');
  const empty = document.getElementById('rpEmptyState');

  // Remove old rows
  body.querySelectorAll('.rp-row').forEach(r => r.remove());

  empty.style.display = reports.length === 0 ? 'flex' : 'none';

  reports.forEach(report => {
    const row = document.createElement('div');
    row.className = 'rp-row';
    row.dataset.id = report.id;

    const badgeClass = `rp-badge rp-badge--${report.status}`;
    const badgeLabel = report.status === 'generating' ? 'Generating…'
                     : report.status === 'draft'      ? 'Draft'
                                                      : 'Final';

    row.innerHTML = `
      <!-- File icon -->
      <div class="rp-file-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>

      <!-- Report name (editable) -->
      <span class="rp-name" contenteditable="true" spellcheck="false"
            onblur="renameReport(${report.id}, this)"
            onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur();}"
      >${escHtml(report.name)}</span>

      <!-- Date -->
      <span class="rp-date">${report.date}</span>

      <!-- Status badge -->
      <span class="rp-status">
        <span class="${badgeClass}">
          <span class="rp-badge-dot"></span>${badgeLabel}
        </span>
      </span>

      <!-- Size -->
      <span class="rp-size">${report.size}</span>

      <!-- Actions: Download + Delete -->
      <div class="rp-actions">
        <button class="rp-action-btn" onclick="downloadReport(${report.id})" title="Download">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>
        <button class="rp-action-btn rp-action-btn--del" onclick="deleteReport(${report.id})" title="Delete">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
    `;

    body.appendChild(row);
  });
}

// ─── Rename ───────────────────────────────────────────────────
function renameReport(id, el) {
  const r = reports.find(x => x.id === id);
  if (r) r.name = el.textContent.trim() || r.name;
}

// ─── Delete ───────────────────────────────────────────────────
function deleteReport(id) {
  reports = reports.filter(x => x.id !== id);
  renderReports();
}

// ─── Download (stub — exports name as txt) ────────────────────
function downloadReport(id) {
  const r = reports.find(x => x.id === id);
  if (!r || r.status === 'generating') return;
  const content = `C2P Report\nName: ${r.name}\nGenerated: ${r.date}\nStatus: ${r.status}\n`;
  const blob = new Blob([content], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `${r.name.replace(/\s+/g, '_')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Helpers ──────────────────────────────────────────────────
function formatRpDate(d) {
  const day  = String(d.getDate()).padStart(2, '0');
  const mon  = d.toLocaleString('en', { month: 'short' });
  const yr   = d.getFullYear();
  const h    = String(d.getHours()).padStart(2, '0');
  const m    = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${mon} ${yr}, ${h}:${m}`;
}

function randomSize() {
  return `${(Math.random() * 3 + 0.4).toFixed(1)} MB`;
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Called from Process Planning "Create Report" ─────────────
// Override the createReport() stub from planning.js
function createReport() {
  // Switch to report tab
  document.querySelectorAll('.sidebar-nav-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.getElementById('page-report').classList.add('active');
  document.querySelector('[title="Report"]').classList.add('active');
  // Auto-generate a new report
  generateReport();
}
