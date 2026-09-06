/* ═══════════════════════════════════════════════════════════════
   C2P — PROJECT PAGE LOGIC
═══════════════════════════════════════════════════════════════ */

// ─── Sidebar toggle ────────────────────────────────────────────
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('expanded');
}

// ─── Version dropdown ───────────────────────────────────────────
function toggleVersionDropdown() {
  const dd = document.getElementById('versionDropdown');
  const menu = document.getElementById('versionMenu');
  const trigger = dd.querySelector('.version-dropdown__trigger');

  dd.classList.toggle('open');

  if (dd.classList.contains('open')) {
    // Measure trigger position and size the menu to match
    const rect = trigger.getBoundingClientRect();
    menu.style.top    = (rect.bottom + 6) + 'px';
    menu.style.left   = rect.left + 'px';
    menu.style.width  = rect.width + 'px';

    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', closeDropdownOutside, { once: true });
    }, 0);
  }
}

function closeDropdownOutside(e) {
  const dd = document.getElementById('versionDropdown');
  if (!dd.contains(e.target)) {
    dd.classList.remove('open');
  }
}

function selectVersion(version, btn) {
  // Update active state on options
  document.querySelectorAll('.version-option').forEach(el => el.classList.remove('active'));
  btn.classList.add('active');

  // Update trigger label
  document.getElementById('activeVersionLabel').textContent = version;

  // Update all version badges
  setAllVersionBadges(version);

  // Close dropdown
  document.getElementById('versionDropdown').classList.remove('open');

  // Reset upload zone for new version (fresh state)
  resetUploadZone();

  // Sync datetime
  updateDateTime();
}

function addNewVersion() {
  document.getElementById('versionDropdown').classList.remove('open');

  const menu = document.getElementById('versionMenu');
  const existing = menu.querySelectorAll('.version-option:not(.version-option--add)');
  const newNum = existing.length + 1;
  const newLabel = `v${newNum}`;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // Build new option
  const btn = document.createElement('button');
  btn.className = 'version-option';
  btn.onclick = function () { selectVersion(newLabel, this); };
  btn.innerHTML = `<span class="vo-label">${newLabel}</span><span class="vo-date">${dateStr}</span>`;

  // Insert before divider
  const divider = menu.querySelector('.version-menu-divider');
  menu.insertBefore(btn, divider);

  // Auto select new version
  selectVersion(newLabel, btn);
}

// ─── Sidebar page switching ───────────────────────────────────────
function switchPage(pageId, navBtn) {
  // Deactivate all sections
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-nav-item').forEach(b => b.classList.remove('active'));

  // Activate target
  document.getElementById('page-' + pageId).classList.add('active');
  navBtn.classList.add('active');
}

// ─── Upload type toggle ───────────────────────────────────────────
let currentUploadType = 'single';

function setUploadType(type) {
  currentUploadType = type;

  document.getElementById('btnSingle').classList.toggle('active', type === 'single');
  document.getElementById('btnMulti').classList.toggle('active', type === 'multi');

  const fileInput = document.getElementById('fileInput');

  if (type === 'single') {
    fileInput.accept = '.pdf,.png,.jpg,.jpeg,.tiff,.bmp,.webp';
    fileInput.removeAttribute('multiple');
    document.getElementById('uploadTitle').textContent = 'Drop your CAED diagram here';
    document.getElementById('uploadHint').textContent = 'or click to browse — PDF or Image accepted';
  } else {
    fileInput.accept = '.zip';
    fileInput.removeAttribute('multiple');
    document.getElementById('uploadTitle').textContent = 'Drop your CAED ZIP archive here';
    document.getElementById('uploadHint').textContent = 'or click to browse — ZIP file with multiple CAED views';
  }

  resetUploadZone();
}

// ─── File upload handling ─────────────────────────────────────────
function triggerFileInput() {
  document.getElementById('fileInput').click();
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) processFile(file);
}

function handleDragOver(event) {
  event.preventDefault();
  document.getElementById('uploadZone').classList.add('drag-over');
}

function handleDragLeave(event) {
  document.getElementById('uploadZone').classList.remove('drag-over');
}

function handleDrop(event) {
  event.preventDefault();
  document.getElementById('uploadZone').classList.remove('drag-over');
  const file = event.dataTransfer.files[0];
  if (file) processFile(file);
}

function processFile(file) {
  // Validate type
  const isZip = file.name.toLowerCase().endsWith('.zip');
  const isImage = /\.(png|jpg|jpeg|tiff|bmp|webp)$/i.test(file.name);
  const isPdf = file.name.toLowerCase().endsWith('.pdf');

  if (currentUploadType === 'multi' && !isZip) {
    showUploadError('Please upload a ZIP file for multiple views.');
    return;
  }
  if (currentUploadType === 'single' && !isImage && !isPdf) {
    showUploadError('Please upload a PDF or image file for a single page diagram.');
    return;
  }

  // Show preview
  document.getElementById('uploadEmpty').style.display = 'none';
  document.getElementById('uploadPreview').style.display = 'flex';

  document.getElementById('previewFilename').textContent = file.name;
  document.getElementById('previewFilesize').textContent = formatFileSize(file.size);

  const now = new Date();
  document.getElementById('previewUploadedAt').textContent =
    'Uploaded ' + now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' at ' + now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  // If it's an image, show thumbnail
  if (isImage) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const thumb = document.getElementById('previewThumb');
      thumb.innerHTML = `<img src="${e.target.result}" alt="CAED preview" />`;
    };
    reader.readAsDataURL(file);
  }

  // Sync the floating date-time to upload time
  updateDateTime(now);
}

function resetUploadZone() {
  document.getElementById('uploadEmpty').style.display = 'flex';
  document.getElementById('uploadPreview').style.display = 'none';
  document.getElementById('fileInput').value = '';
  document.getElementById('previewThumb').innerHTML = `
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>`;
}

function showUploadError(msg) {
  alert(msg); // Will be replaced with a proper toast in real implementation
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// ─── Floating Date-Time ────────────────────────────────────────────
// Syncs to last upload/update action

let lastUpdateTime = null;

function updateDateTime(date) {
  lastUpdateTime = date || new Date();

  const d = lastUpdateTime;
  const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  document.getElementById('floatDate').textContent = dateStr;
  document.getElementById('floatTime').textContent = timeStr;
}

// Tick every second so the "last update" time display stays sharp
// (only updates the displayed time if < 60s ago; otherwise keeps the recorded timestamp)
function tickClock() {
  if (lastUpdateTime) {
    const now = new Date();
    const diff = now - lastUpdateTime; // ms
    if (diff < 60000) {
      // Show live time
      document.getElementById('floatTime').textContent =
        lastUpdateTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  }
}

// ─── Init ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // ── Read URL query params ──
  const params = new URLSearchParams(window.location.search);
  const jobId      = params.get('id')       || 'JOB-001';
  const jobName    = params.get('name')     || 'Bridge Structure Analysis';
  const versionsRaw = params.get('versions') || 'v1';
  const jobDate    = params.get('date')     || '';

  // ── Populate sidebar project label ──
  const labelEl = document.querySelector('.sidebar__project-label span');
  if (labelEl) labelEl.textContent = `${jobId} · ${jobName}`;

  // ── Build version list from URL ──
  const versions = versionsRaw
    ? versionsRaw.split(',').map(v => v.trim()).filter(Boolean)
    : [];

  const menu = document.getElementById('versionMenu');
  const addBtn = menu.querySelector('.version-option--add');
  const divider = menu.querySelector('.version-menu-divider');

  // Clear existing static version options (keep divider + add btn)
  menu.querySelectorAll('.version-option:not(.version-option--add)').forEach(el => el.remove());

  if (versions.length === 0) {
    // No versions: start fresh, trigger add immediately on first upload
    document.getElementById('activeVersionLabel').textContent = '—';
    setAllVersionBadges('—');
  } else {
    // Insert version options
    versions.forEach((ver, i) => {
      const btn = document.createElement('button');
      btn.className = 'version-option' + (i === 0 ? ' active' : '');
      btn.onclick = function () { selectVersion(ver, this); };
      btn.innerHTML = `<span class="vo-label">${ver}</span><span class="vo-date">${jobDate}</span>`;
      menu.insertBefore(btn, divider);
    });

    // Set first version as active
    const firstVer = versions[0];
    document.getElementById('activeVersionLabel').textContent = firstVer;
    setAllVersionBadges(firstVer);
  }

  // ── Populate page section headers with job name ──
  document.querySelectorAll('.page-section-sub').forEach((el, i) => {
    if (i === 0) el.textContent = `Upload CAED drawing for ${jobName}`;
    if (i === 1) el.textContent = `AI-extracted parameters for ${jobName}`;
    if (i === 2) el.textContent = `AI process plan for ${jobName}`;
    if (i === 3) el.textContent = `Final report for ${jobName}`;
  });

  // ── Set initial upload type ──
  setUploadType('single');

  // ── Set datetime to page open time ──
  updateDateTime(new Date());

  // ── Tick clock ──
  setInterval(tickClock, 1000);
});

// Helper: update all version badges at once
function setAllVersionBadges(ver) {
  document.querySelectorAll('.version-badge').forEach(el => {
    el.textContent = ver;
  });
}
