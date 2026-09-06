/* ═══════════════════════════════════════════════════════════════
   EXTRACTION PAGE LOGIC — appended to project.js
═══════════════════════════════════════════════════════════════ */

// ─── Row selection ────────────────────────────────────────────
function selectRow(row) {
  // Deselect all, select clicked
  document.querySelectorAll('.ext-row').forEach(r => r.classList.remove('selected'));
  row.classList.add('selected');

  // If editing mode is on, focus the value cell
  if (document.getElementById('checkEditing').checked) {
    const val = row.querySelector('.ext-value');
    if (val) {
      val.contentEditable = 'true';
      val.focus();
      // Place cursor at end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(val);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }
}

// ─── Edit mode toggle ────────────────────────────────────────
let editingMode = false;

function toggleEditing() {
  editingMode = !editingMode;
  const editBtn = document.querySelector('.ext-btn-edit');
  const checkEditing = document.getElementById('checkEditing');

  document.querySelectorAll('.ext-value').forEach(v => {
    v.contentEditable = editingMode ? 'true' : 'false';
  });

  if (editingMode) {
    editBtn.style.borderColor = 'rgba(255,193,7,0.4)';
    editBtn.style.color = '#ffc107';
    editBtn.style.background = 'rgba(255,193,7,0.08)';
    editBtn.textContent = '';
    editBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Done Editing`;
    checkEditing.checked = true;
    updateValidationState();
  } else {
    editBtn.removeAttribute('style');
    editBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit Values`;
    checkEditing.checked = false;
    updateValidationState();
  }
}

// ─── Validation state ────────────────────────────────────────
function updateValidationState() {
  const verified = document.getElementById('checkVerified').checked;
  const editing  = document.getElementById('checkEditing').checked;
  const statusEl = document.getElementById('validationStatus');

  if (editing) {
    statusEl.textContent = '✎ Currently being edited';
    statusEl.style.color = '#ffc107';
  } else if (verified) {
    statusEl.textContent = '✓ Verified — ready to proceed';
    statusEl.style.color = '#4caf82';
  } else {
    statusEl.textContent = '— Not validated';
    statusEl.style.color = '';
  }
}

// ─── Confirm & proceed ───────────────────────────────────────
function confirmValidation() {
  const verified = document.getElementById('checkVerified').checked;
  if (!verified) {
    // Briefly pulse the verified checkbox
    const label = document.querySelector('.ext-check-item');
    label.style.outline = '1px solid rgba(244,67,54,0.5)';
    label.style.borderRadius = '4px';
    setTimeout(() => label.style.outline = '', 1200);
    return;
  }
  // Switch to Process Planning tab
  document.querySelectorAll('.sidebar-nav-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.getElementById('page-planning').classList.add('active');
  document.querySelector('[title="Process Planning"]').classList.add('active');
}

// ─── Bot chat ────────────────────────────────────────────────
const botReplies = [
  'I\'ve highlighted the low-confidence rows in amber. Please review Load Class and Steel Grade.',
  'You can click any row to inspect it. In Edit mode, values become directly editable.',
  'Once you\'re satisfied, tick Verified and hit Confirm & Proceed to move to Process Planning.',
  'Need a specific parameter explained? Just ask me.',
  'The extraction is based on the uploaded CAED diagram. If you replace the diagram, re-extraction will be triggered.',
];
let botReplyIdx = 0;

function sendBotMessage(event) {
  if (event.key !== 'Enter') return;
  const input = document.getElementById('botInput');
  const text = input.value.trim();
  if (!text) return;

  const messages = document.getElementById('botMessages');

  // User message
  const userMsg = document.createElement('div');
  userMsg.className = 'bot-msg bot-msg--user';
  userMsg.innerHTML = `<p>${text}</p>`;
  messages.appendChild(userMsg);

  input.value = '';

  // Bot reply (cycle through canned responses)
  setTimeout(() => {
    const aiMsg = document.createElement('div');
    aiMsg.className = 'bot-msg bot-msg--ai';
    aiMsg.innerHTML = `<p>${botReplies[botReplyIdx % botReplies.length]}</p>`;
    messages.appendChild(aiMsg);
    botReplyIdx++;
    messages.scrollTop = messages.scrollHeight;
  }, 600);

  messages.scrollTop = messages.scrollHeight;
}
