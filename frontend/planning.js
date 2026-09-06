/* ═══════════════════════════════════════════════════════════════
   PROCESS PLANNING PAGE LOGIC
═══════════════════════════════════════════════════════════════ */

let ppSteps = [];
let ppDragSrc = null;

// ─── Add step ─────────────────────────────────────────────────
function addStep() {
  const id = Date.now();
  ppSteps.push({ id });
  renderSteps();
  // Focus the operation cell of new row
  setTimeout(() => {
    const rows = document.querySelectorAll('.pp-step-row');
    const last = rows[rows.length - 1];
    if (last) last.querySelector('.pp-cell[data-field="op"]').focus();
  }, 60);
}

// ─── Delete step ──────────────────────────────────────────────
function deleteStep(id) {
  ppSteps = ppSteps.filter(s => s.id !== id);
  renderSteps();
}

// ─── Clear all ────────────────────────────────────────────────
function clearAllSteps() {
  if (ppSteps.length === 0) return;
  ppSteps = [];
  renderSteps();
}

// ─── Render ───────────────────────────────────────────────────
function renderSteps() {
  const list  = document.getElementById('ppStepsList');
  const empty = document.getElementById('ppEmptyState');
  const count = document.getElementById('ppStepCount');

  // Clear rows (keep empty state element)
  list.querySelectorAll('.pp-step-row').forEach(r => r.remove());

  const n = ppSteps.length;
  count.textContent = n === 0 ? '0 steps' : `${n} step${n > 1 ? 's' : ''}`;
  empty.style.display = n === 0 ? 'flex' : 'none';

  ppSteps.forEach((step, idx) => {
    const row = document.createElement('div');
    row.className = 'pp-step-row';
    row.draggable = true;
    row.dataset.id = step.id;

    row.innerHTML = `
      <!-- Drag handle -->
      <div class="pp-drag-handle" title="Drag to reorder">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9"  cy="5"  r="1"/><circle cx="9"  cy="12" r="1"/><circle cx="9"  cy="19" r="1"/>
          <circle cx="15" cy="5"  r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
        </svg>
      </div>
      <!-- Step number -->
      <span class="pp-step-num">${String(idx + 1).padStart(2, '0')}</span>
      <!-- Editable cells -->
      <span class="pp-cell" contenteditable="true" data-field="op"    data-placeholder="e.g. Rough Milling"  >${step.op     || ''}</span>
      <span class="pp-cell" contenteditable="true" data-field="machine" data-placeholder="e.g. CNC 5-Axis"    >${step.machine|| ''}</span>
      <span class="pp-cell" contenteditable="true" data-field="tool"  data-placeholder="e.g. Ø16 End Mill"   >${step.tool   || ''}</span>
      <span class="pp-cell" contenteditable="true" data-field="params" data-placeholder="e.g. 2500 rpm, 0.2 ap">${step.params || ''}</span>
      <span class="pp-cell" contenteditable="true" data-field="dur"   data-placeholder="e.g. 45 min"         >${step.dur    || ''}</span>
      <!-- Delete -->
      <button class="pp-row-del" onclick="deleteStep(${step.id})" title="Remove step">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;

    // Save edits back to state on blur
    row.querySelectorAll('.pp-cell').forEach(cell => {
      cell.addEventListener('blur', () => {
        const s = ppSteps.find(x => x.id === step.id);
        if (s) s[cell.dataset.field] = cell.textContent.trim();
        updateStepCount();
      });
      // Tab between cells
      cell.addEventListener('keydown', e => {
        if (e.key === 'Tab') {
          e.preventDefault();
          const cells = Array.from(row.querySelectorAll('.pp-cell'));
          const i = cells.indexOf(e.target);
          if (e.shiftKey) {
            (cells[i - 1] || cells[cells.length - 1]).focus();
          } else {
            if (i === cells.length - 1) {
              addStep(); // Tab on last cell adds new row
            } else {
              cells[i + 1].focus();
            }
          }
        }
        if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
      });
    });

    // ── Drag-and-drop reorder ──
    row.addEventListener('dragstart', e => {
      ppDragSrc = row;
      row.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    row.addEventListener('dragend', () => {
      ppDragSrc = null;
      document.querySelectorAll('.pp-step-row').forEach(r => {
        r.classList.remove('dragging', 'drag-over');
      });
    });
    row.addEventListener('dragover', e => {
      e.preventDefault();
      if (ppDragSrc && ppDragSrc !== row) {
        document.querySelectorAll('.pp-step-row').forEach(r => r.classList.remove('drag-over'));
        row.classList.add('drag-over');
      }
    });
    row.addEventListener('drop', e => {
      e.preventDefault();
      if (ppDragSrc && ppDragSrc !== row) {
        const srcId = parseInt(ppDragSrc.dataset.id);
        const dstId = parseInt(row.dataset.id);
        const si = ppSteps.findIndex(s => s.id === srcId);
        const di = ppSteps.findIndex(s => s.id === dstId);
        const [moved] = ppSteps.splice(si, 1);
        ppSteps.splice(di, 0, moved);
        renderSteps();
      }
    });

    list.appendChild(row);
  });
}

function updateStepCount() {
  const n = ppSteps.length;
  document.getElementById('ppStepCount').textContent =
    n === 0 ? '0 steps' : `${n} step${n > 1 ? 's' : ''}`;
}

// ─── Bot strip toggle ─────────────────────────────────────────
function togglePpBot() {
  const body    = document.getElementById('ppBotBody');
  const chevron = document.getElementById('ppBotChevron');
  const open    = body.style.display === 'none';
  body.style.display = open ? 'flex' : 'none';
  body.style.flexDirection = 'column';
  chevron.classList.toggle('open', open);
}

// ─── Bot chat ─────────────────────────────────────────────────
const ppBotReplies = [
  'Tip: use Tab to jump between cells, Tab on the last cell adds a new row automatically.',
  'You can drag the ⠿ handle on the left to reorder steps.',
  'Typical sequence: Rough → Semi-Finish → Finish → Inspect → Deburr.',
  'When all steps are filled, hit Create Report to generate the final document.',
  'I can suggest tooling and parameters if you describe the material and feature.',
];
let ppBotIdx = 0;

function sendPpBotMessage(event) {
  if (event.key !== 'Enter') return;
  const input = document.getElementById('ppBotInput');
  const text = input.value.trim();
  if (!text) return;

  const msgs = document.getElementById('ppBotMessages');
  const userMsg = document.createElement('div');
  userMsg.className = 'bot-msg bot-msg--user';
  userMsg.innerHTML = `<p>${text}</p>`;
  msgs.appendChild(userMsg);
  input.value = '';

  setTimeout(() => {
    const aiMsg = document.createElement('div');
    aiMsg.className = 'bot-msg bot-msg--ai';
    aiMsg.innerHTML = `<p>${ppBotReplies[ppBotIdx % ppBotReplies.length]}</p>`;
    msgs.appendChild(aiMsg);
    ppBotIdx++;
    msgs.scrollTop = msgs.scrollHeight;
  }, 500);

  msgs.scrollTop = msgs.scrollHeight;
}

// ─── Create Report ────────────────────────────────────────────
function createReport() {
  // Navigate to Report page
  document.querySelectorAll('.sidebar-nav-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.getElementById('page-report').classList.add('active');
  document.querySelector('[title="Report"]').classList.add('active');
}

// ─── Download plan as CSV ─────────────────────────────────────
function downloadPlan() {
  if (ppSteps.length === 0) return;
  const headers = ['#', 'Operation', 'Machine/Process', 'Tool/Fixture', 'Parameters', 'Duration'];
  const rows = ppSteps.map((s, i) => [
    i + 1,
    `"${(s.op     || '').replace(/"/g, '""')}"`,
    `"${(s.machine|| '').replace(/"/g, '""')}"`,
    `"${(s.tool   || '').replace(/"/g, '""')}"`,
    `"${(s.params || '').replace(/"/g, '""')}"`,
    `"${(s.dur    || '').replace(/"/g, '""')}"`,
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = 'process_plan.csv';
  a.click();
  URL.revokeObjectURL(url);
}
