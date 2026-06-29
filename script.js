/**
 * Beltah VCF Manager Architecture
 * Production Grade single-page application core script
 */

// Application State Layer
const State = {
  activeView: 'tool-view',
  contacts: [],
  activeTab: 'upload-tab',
  parsedCache: null,
  isAuthenticated: false,
  failedAttempts: 0,
  lockoutTimer: null,
  pagination: {
    currentPage: 1,
    rowsPerPage: 10,
    filteredData: []
  }
};

// Application Config Constants
const CONFIG = {
  STORAGE_PREFIX: 'beltah_',
  PASS_HASH: 'Beltah@2026',
  MAX_TOASTS: 4
};

// Initializer Module
document.addEventListener('DOMContentLoaded', () => {
  initAuroraCanvas();
  loadLocalData();
  setupNavigation();
  setupSegmentedTabs();
  setupDropZone();
  setupTextareaEngine();
  setupValidationTriggers();
  setupAdminGate();
  setupToolbarControls();
  setupKeyboardShortcuts();
  
  // Direct authentication check routing
  if (sessionStorage.getItem(CONFIG.STORAGE_PREFIX + 'auth') === 'true' || 
      localStorage.getItem(CONFIG.STORAGE_PREFIX + 'auth') === 'true') {
    State.isAuthenticated = true;
  }
});

// 1. ANIMATED CANVAS BACKGROUND ENGINE
function initAuroraCanvas() {
  const canvas = document.getElementById('aurora');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;
  
  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const colors = ['#7c3aed', '#a855f7', '#06b6d4'];
  const orbs = [];
  
  for (let i = 0; i < 6; i++) {
    orbs.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 300 + 300,
      color: colors[i % colors.length],
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      speedPhase: Math.random() * 0.002 + 0.001
    });
  }

  let lastTime = 0;
  const fpsInterval = 1000 / 40; // 40 FPS throttle target

  function animate(timestamp) {
    requestAnimationFrame(animate);
    
    if (timestamp - lastTime < fpsInterval) return;
    lastTime = timestamp;
    
    ctx.fillStyle = '#05050a';
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'screen';
    
    orbs.forEach(orb => {
      orb.phaseX += orb.speedPhase;
      orb.phaseY += orb.speedPhase;
      
      const driftX = Math.sin(orb.phaseX) * 80;
      const driftY = Math.cos(orb.phaseY) * 80;
      
      let cx = orb.x + driftX;
      let cy = orb.y + driftY;
      
      let gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, orb.radius);
      gradient.addColorStop(0, hexToRgba(orb.color, 0.09));
      gradient.addColorStop(0.5, hexToRgba(orb.color, 0.03));
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, orb.radius, 0, Math.PI * 2);
      ctx.fill();
      
      orb.x += orb.vx;
      orb.y += orb.vy;
      
      if (orb.x < -orb.radius) orb.x = width + orb.radius;
      if (orb.x > width + orb.radius) orb.x = -orb.radius;
      if (orb.y < -orb.radius) orb.y = height + orb.radius;
      if (orb.y > height + orb.radius) orb.y = -orb.radius;
    });
  }
  
  requestAnimationFrame(animate);
}

function hexToRgba(hex, alpha) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})` : hex;
}

// 2. STATE STORAGE ACCESSORS
function loadLocalData() {
  const stored = localStorage.getItem(CONFIG.STORAGE_PREFIX + 'vcf_contacts');
  if (stored) {
    try {
      State.contacts = JSON.parse(stored);
    } catch(e) {
      State.contacts = [];
    }
  }
  updateGlobalCounters();
}

function updateGlobalCounters() {
  const counterText = document.getElementById('local-counter-text');
  if (counterText) {
    counterText.textContent = `${State.contacts.length} contact${State.contacts.length === 1 ? '' : 's'} stored locally`;
  }
}

// 3. NAVIGATION VIEW SWITCH ROUTER
function setupNavigation() {
  const pills = document.querySelectorAll('.nav-btn');
  const slider = document.querySelector('.nav-slider');
  
  pills.forEach((pill, idx) => {
    pill.addEventListener('click', () => {
      const target = pill.getAttribute('data-target');
      
      if (target === 'admin-view' && !State.isAuthenticated) {
        switchView('admin-view');
        renderAdminState();
        if (slider) slider.style.transform = `translateX(${idx * 100}%)`;
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        return;
      }
      
      switchView(target);
      if (slider) slider.style.transform = `translateX(${idx * 100}%)`;
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
    });
  });
}

function switchView(viewId) {
  State.activeView = viewId;
  document.querySelectorAll('.view-section').forEach(sec => {
    sec.classList.remove('active-view');
    if(sec.id === viewId) sec.classList.add('active-view');
  });
}

// 4. SEGMENTED TABS COMPONENT
function setupSegmentedTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabSlider = document.querySelector('.tab-slider');
  
  tabBtns.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      State.activeTab = tabId;
      
      if (tabSlider) tabSlider.style.transform = `translateX(${idx * 100}%)`;
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      document.querySelectorAll('.tab-content').forEach(tc => {
        tc.classList.remove('active-content');
        if (tc.id === tabId) tc.classList.add('active-content');
      });
      
      clearParsedEngineCache();
    });
  });
}

// 5. FILE INGESTION DROP ZONE
function setupDropZone() {
  const dz = document.getElementById('drop-zone');
  const fi = document.getElementById('file-input');
  if (!dz || !fi) return;
  
  dz.addEventListener('click', () => fi.click());
  
  dz.addEventListener('dragover', (e) => {
    e.preventDefault();
    dz.classList.add('dragover');
  });
  
  dz.addEventListener('dragleave', () => {
    dz.classList.remove('dragover');
  });
  
  dz.addEventListener('drop', (e) => {
    e.preventDefault();
    dz.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  });
  
  fi.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      processSelectedFile(e.target.files[0]);
    }
  });
}

function processSelectedFile(file) {
  const dz = document.getElementById('drop-zone');
  const wrapper = document.getElementById('file-success-pills');
  if (!file.name.endsWith('.vcf')) {
    showToast('Invalid file extension. Please select a .vcf asset', 'error');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    dz.classList.add('success-drop');
    
    // Mutate internal drop zone view metrics safely
    if (wrapper) {
      wrapper.innerHTML = `<div class="file-pilled-chip"><i class="fa-solid fa-file-code"></i> ${escapeHtml(file.name)}</div>`;
    }
    
    executeVcfValidationEngine(text);
  };
  reader.readAsText(file);
}

// 6. PASTE TEXTAREA ENGINE
function setupTextareaEngine() {
  const ta = document.getElementById('vcf-textarea');
  const counter = document.getElementById('char-counter');
  if (!ta || !counter) return;
  
  ta.addEventListener('input', () => {
    const len = ta.value.length;
    const lines = ta.value === "" ? 0 : ta.value.split('\n').length;
    counter.textContent = `${len} char${len === 1 ? '' : 's'} / ${lines} line${lines === 1 ? '' : 's'}`;
    executeVcfValidationEngine(ta.value);
  });
}

function clearParsedEngineCache() {
  State.parsedCache = null;
  document.getElementById('preview-card').classList.add('hidden');
  document.getElementById('save-vcf-btn').disabled = true;
  
  const dz = document.getElementById('drop-zone');
  const wrapper = document.getElementById('file-success-pills');
  if (dz) dz.classList.remove('success-drop');
  if (wrapper) wrapper.innerHTML = '';
  
  const ta = document.getElementById('vcf-textarea');
  if (ta) {
    ta.value = '';
    const counter = document.getElementById('char-counter');
    if (counter) counter.textContent = '0 chars / 0 lines';
  }
}

// 7. REGEX PARSING AND VALIDATION ENGINE
function executeVcfValidationEngine(rawText) {
  const cleaned = rawText.trim();
  const previewCard = document.getElementById('preview-card');
  const saveBtn = document.getElementById('save-vcf-btn');
  
  if (!cleaned) {
    previewCard.classList.add('hidden');
    saveBtn.disabled = true;
    State.parsedCache = null;
    return;
  }
  
  if (!cleaned.startsWith('BEGIN:VCARD') || !cleaned.includes('END:VCARD')) {
    renderInvalidPreview('Malformed Structure: Missing Envelope Blocks');
    return;
  }
  
  // Segment parsing boundary instances
  const cards = cleaned.split(/END:VCARD/i)
                       .map(c => c.trim() + '\nEND:VCARD')
                       .filter(c => c.startsWith('BEGIN:VCARD'));
                       
  if (cards.length === 0) {
    renderInvalidPreview('Invalid Target Context');
    return;
  }
  
  const parsedContacts = [];
  
  cards.forEach(cardStr => {
    const meta = parseSingleVCard(cardStr);
    if (meta.name || meta.phone || meta.email) {
      parsedContacts.push(meta);
    }
  });
  
  if (parsedContacts.length === 0) {
    renderInvalidPreview('No extractable records encountered');
    return;
  }
  
  State.parsedCache = parsedContacts;
  renderValidPreview(parsedContacts);
  saveBtn.disabled = false;
}

function parseSingleVCard(rawStr) {
  const data = { name: '', phone: '', email: '', org: '', title: '', address: '', url: '', bday: '', note: '', raw: rawStr };
  
  const lines = rawStr.split(/\r?\n/);
  lines.forEach(line => {
    const upper = line.trim();
    if (!upper) return;
    
    // Capture token delimiter match profiles
    const splitIdx = upper.indexOf(':');
    if (splitIdx === -1) return;
    
    const keyPart = upper.substring(0, splitIdx);
    const valuePart = upper.substring(splitIdx + 1).trim();
    const keyBase = keyPart.split(';')[0].toUpperCase();
    
    switch(keyBase) {
      case 'FN':
        data.name = valuePart;
        break;
      case 'TEL':
        if (!data.phone) data.phone = valuePart; // Capture primary record node
        break;
      case 'EMAIL':
        if (!data.email) data.email = valuePart;
        break;
      case 'ORG':
        data.org = valuePart.replace(/;/g, ' ').trim();
        break;
      case 'TITLE':
        data.title = valuePart;
        break;
      case 'ADR':
        data.address = valuePart.replace(/;/g, ' ').trim();
        break;
      case 'URL':
        data.url = valuePart;
        break;
      case 'BDAY':
        data.bday = valuePart;
        break;
      case 'NOTE':
        data.note = valuePart;
        break;
    }
  });
  
  if (!data.name && data.phone) data.name = 'Contact ' + data.phone;
  return data;
}

function renderInvalidPreview(errorMsg) {
  const pCard = document.getElementById('preview-card');
  const avatar = document.getElementById('preview-avatar');
  const nameEl = document.getElementById('preview-name');
  const badge = document.getElementById('preview-status-badge');
  const body = document.getElementById('preview-details');
  const saveBtn = document.getElementById('save-vcf-btn');
  
  avatar.textContent = '✗';
  avatar.style.background = 'var(--accent-red)';
  nameEl.textContent = 'Validation Interrupted';
  badge.className = 'status-badge invalid';
  badge.textContent = 'Invalid Format';
  body.innerHTML = `<div class="preview-row" style="color:var(--accent-red)"><i class="fa-solid fa-circle-exclamation"></i>${escapeHtml(errorMsg)}</div>`;
  
  pCard.classList.remove('hidden');
  saveBtn.disabled = true;
  State.parsedCache = null;
}

function renderValidPreview(contacts) {
  const pCard = document.getElementById('preview-card');
  const avatar = document.getElementById('preview-avatar');
  const nameEl = document.getElementById('preview-name');
  const badge = document.getElementById('preview-status-badge');
  const body = document.getElementById('preview-details');
  
  pCard.classList.remove('hidden');
  
  if (contacts.length > 1) {
    avatar.textContent = contacts.length;
    avatar.style.background = 'linear-gradient(135deg, var(--accent-amber), var(--accent-purple))';
    nameEl.textContent = 'Multi-Record Batch Stream';
    badge.className = 'status-badge multi';
    badge.textContent = `${contacts.length} contacts detected`;
    
    let html = '';
    const sliceCount = Math.min(contacts.length, 3);
    for(let i=0; i<sliceCount; i++) {
      html += `<div class="preview-row"><i class="fa-solid fa-user"></i><span><b>${escapeHtml(contacts[i].name)}</b> - ${escapeHtml(contacts[i].phone || 'No phone')}</span></div>`;
    }
    if(contacts.length > 3) {
      html += `<div class="preview-row" style="color:var(--text-muted)"><i class="fa-solid fa-ellipsis"></i><span>and ${contacts.length - 3} more records...</span></div>`;
    }
    body.innerHTML = html;
  } else {
    const target = contacts[0];
    const initials = target.name ? target.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : '??';
    
    avatar.textContent = initials;
    avatar.style.background = 'linear-gradient(135deg, var(--accent-violet), var(--accent-cyan))';
    nameEl.textContent = escapeHtml(target.name);
    badge.className = 'status-badge valid';
    badge.textContent = '✓ Valid vCard';
    
    let html = '';
    if(target.phone) html += `<div class="preview-row"><i class="fa-solid fa-phone"></i><span>${escapeHtml(target.phone)}</span></div>`;
    if(target.email) html += `<div class="preview-row"><i class="fa-solid fa-envelope"></i><span>${escapeHtml(target.email)}</span></div>`;
    if(target.org) html += `<div class="preview-row"><i class="fa-solid fa-building"></i><span>${escapeHtml(target.org)}</span></div>`;
    if(!html) html = `<div class="preview-row" style="color:var(--text-muted)"><i class="fa-solid fa-circle-info"></i><span>No data properties explicitly assigned</span></div>`;
    body.innerHTML = html;
  }
}

// 8. STORAGE PERSISTENCE HANDLING
function setupValidationTriggers() {
  const btn = document.getElementById('save-vcf-btn');
  if(!btn) return;
  
  btn.addEventListener('click', () => {
    if(!State.parsedCache || State.parsedCache.length === 0) return;
    
    btn.innerHTML = `<i class="fa-solid fa-circle-notch spinner"></i> Committing Matrix...`;
    btn.disabled = true;
    
    setTimeout(() => {
      const stamp = new Date().toISOString();
      State.parsedCache.forEach(item => {
        const generated = {
          id: 'vcf_x_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
          name: item.name || 'Unnamed Record',
          phone: item.phone || '',
          email: item.email || '',
          org: item.org || '',
          raw: item.raw,
          savedAt: stamp
        };
        State.contacts.push(generated);
      });
      
      localStorage.setItem(CONFIG.STORAGE_PREFIX + 'vcf_contacts', JSON.stringify(State.contacts));
      
      showToast(`Successfully registered ${State.parsedCache.length} element context maps`, 'success');
      clearParsedEngineCache();
      updateGlobalCounters();
      
      btn.innerHTML = `<span class="btn-text">Save Extracted Contacts</span>`;
      btn.disabled = true;
    }, 600);
  });
}

// 9. SECURITY & PASSWORD GATE IMPLEMENTATION
function setupAdminGate() {
  const form = document.getElementById('gate-form');
  const passInput = document.getElementById('gate-password');
  const toggleBtn = document.getElementById('toggle-password-btn');
  const errorEl = document.getElementById('gate-error');
  const lockBtn = document.getElementById('lock-session-btn');
  
  if(toggleBtn && passInput) {
    toggleBtn.addEventListener('click', () => {
      const icon = toggleBtn.querySelector('i');
      if (passInput.type === 'password') {
        passInput.type = 'text';
        icon.className = 'fa-solid fa-eye-slash';
      } else {
        passInput.type = 'password';
        icon.className = 'fa-solid fa-eye';
      }
    });
  }
  
  if(form) {
    form.addEventListener('submit', () => {
      if (State.lockoutTimer) return;
      
      const val = passInput.value;
      const gateCard = document.getElementById('password-gate');
      
      if (val === CONFIG.PASS_HASH) {
        State.isAuthenticated = true;
        State.failedAttempts = 0;
        errorEl.classList.add('hidden');
        passInput.classList.remove('error-border');
        passInput.value = '';
        
        const remember = document.getElementById('remember-session');
        if (remember && remember.checked) {
          localStorage.setItem(CONFIG.STORAGE_PREFIX + 'auth', 'true');
        } else {
          sessionStorage.setItem(CONFIG.STORAGE_PREFIX + 'auth', 'true');
        }
        
        showToast('Access pipeline granted', 'success');
        renderAdminState();
      } else {
        State.failedAttempts++;
        gateCard.classList.remove('shake');
        void gateCard.offsetWidth; // Trigger layout engine execution reflow
        gateCard.classList.add('shake');
        passInput.classList.add('error-border');
        errorEl.classList.remove('hidden');
        errorEl.textContent = `⚠ Incorrect verification pipeline authentication (${State.failedAttempts}/3)`;
        
        if (State.failedAttempts >= 3) {
          initiateLockoutTimer();
        }
      }
    });
  }
  
  if(lockBtn) {
    lockBtn.addEventListener('click', () => {
      State.isAuthenticated = false;
      sessionStorage.removeItem(CONFIG.STORAGE_PREFIX + 'auth');
      localStorage.removeItem(CONFIG.STORAGE_PREFIX + 'auth');
      showToast('Administrative context lifecycle decoupled', 'info');
      renderAdminState();
    });
  }
}

function initiateLockoutTimer() {
  const passInput = document.getElementById('gate-password');
  const btn = document.getElementById('submit-gate-btn');
  const errorEl = document.getElementById('gate-error');
  
  let timeLeft = 30;
  passInput.disabled = true;
  btn.disabled = true;
  
  State.lockoutTimer = setInterval(() => {
    timeLeft--;
    errorEl.textContent = `🚨 Security Lockout: Pipeline terminal throttled for ${timeLeft}s`;
    
    if (timeLeft <= 0) {
      clearInterval(State.lockoutTimer);
      State.lockoutTimer = null;
      State.failedAttempts = 0;
      passInput.disabled = false;
      btn.disabled = false;
      errorEl.classList.add('hidden');
    }
  }, 1000);
}

function renderAdminState() {
  const gate = document.getElementById('password-gate');
  const dashboard = document.getElementById('admin-dashboard');
  
  if (State.activeView !== 'admin-view') return;
  
  if (!State.isAuthenticated) {
    gate.classList.remove('hidden');
    dashboard.classList.add('hidden');
  } else {
    gate.classList.add('hidden');
    dashboard.classList.remove('hidden');
    calculateMetrics();
    filterAndRenderTable();
  }
}

// 10. METRICS COUNT-UP ENGINE
function calculateMetrics() {
  const total = State.contacts.length;
  
  // Metric 2 calculation: Today matching boundary profiles
  const startOfToday = new Date();
  startOfToday.setHours(0,0,0,0);
  const savedToday = State.contacts.filter(c => new Date(c.savedAt) >= startOfToday).length;
  
  // Metric 3 calculation: Allocated string capacity calculation
  const sizeKb = (JSON.stringify(State.contacts).length / 1024);
  
  // Metric 4 calculation: Trace chronological timestamps
  let lastImportStr = '-';
  if(total > 0) {
    const newest = new Date(Math.max(...State.contacts.map(c => new Date(c.savedAt).getTime())));
    lastImportStr = formatRelativeTime(newest);
  }
  
  animateValueCounter('metric-total', total, 800);
  animateValueCounter('metric-today', savedToday, 800);
  
  document.getElementById('metric-storage').textContent = `${sizeKb.toFixed(1)} KB`;
  document.getElementById('metric-last').textContent = lastImportStr;
}

function animateValueCounter(id, targetVal, duration) {
  const el = document.getElementById(id);
  if (!el) return;
  let start = 0;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Apply var(--ease-spring) representation scaling mathematically
    const easeProgress = 1 - Math.pow(1 - progress, 3); 
    const current = Math.floor(easeProgress * targetVal);
    
    el.textContent = current;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = targetVal;
    }
  }
  requestAnimationFrame(update);
}

function formatRelativeTime(dateObj) {
  const now = new Date();
  const diffMs = now - dateObj;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return dateObj.toLocaleDateString(undefined, {month:'short', day:'numeric'});
}

// 11. TABLE CONTROLS, SEARCH, AND PAGINATION
function setupToolbarControls() {
  const search = document.getElementById('table-search');
  const sort = document.getElementById('table-sort');
  const exportAll = document.getElementById('export-all-btn');
  const clearAll = document.getElementById('clear-all-btn');
  
  let debounceTimeout;
  if(search) {
    search.addEventListener('input', () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        State.pagination.currentPage = 1;
        filterAndRenderTable();
      }, 200);
    });
  }
  
  if(sort) {
    sort.addEventListener('change', () => {
      filterAndRenderTable();
    });
  }
  
  if(exportAll) exportAll.addEventListener('click', () => triggerExportAllEngine());
  if(clearAll) clearAll.addEventListener('click', () => triggerWipeSequence(clearAll));
}

function filterAndRenderTable() {
  const query = (document.getElementById('table-search')?.value || '').toLowerCase().trim();
  const sortVal = document.getElementById('table-sort')?.value || 'date-desc';
  
  let result = [...State.contacts];
  
  if (query) {
    result = result.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.phone.includes(query) || 
      c.email.toLowerCase().includes(query) || 
      c.org.toLowerCase().includes(query)
    );
  }
  
  // Execute logical matrix sort mapping
  result.sort((a, b) => {
    if (sortVal === 'name-asc') return a.name.localeCompare(b.name);
    if (sortVal === 'name-desc') return b.name.localeCompare(a.name);
    if (sortVal === 'date-desc') return new Date(b.savedAt) - new Date(a.savedAt);
    if (sortVal === 'date-asc') return new Date(a.savedAt) - new Date(b.savedAt);
    return 0;
  });
  
  State.pagination.filteredData = result;
  document.getElementById('table-count-badge').textContent = result.length;
  
  renderTablePage();
}

function renderTablePage() {
  const tbody = document.getElementById('table-body');
  const emptyState = document.getElementById('table-empty-state');
  if(!tbody) return;
  
  tbody.innerHTML = '';
  const data = State.pagination.filteredData;
  const total = data.length;
  
  if (total === 0) {
    emptyState.classList.remove('hidden');
    const isSearch = (document.getElementById('table-search')?.value || '').trim() !== '';
    emptyState.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <h4>${isSearch ? 'No parameters matched configuration' : 'Repository Matrix Empty'}</h4>
        <p>${isSearch ? 'Refine search terms or remove constraints' : 'Ingest a valid .vcf stream to begin monitoring analysis'}</p>
      </div>`;
    document.getElementById('pagination-wrapper').classList.add('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  
  const perPage = State.pagination.rowsPerPage;
  const currPage = State.pagination.currentPage;
  const startIdx = (currPage - 1) * perPage;
  const endIdx = Math.min(startIdx + perPage, total);
  
  const targetSlice = data.slice(startIdx, endIdx);
  
  targetSlice.forEach((contact, idx) => {
    const tr = document.createElement('tr');
    tr.className = 'contact-row';
    tr.style.opacity = '0';
    tr.style.transform = 'translateY(10px)';
    
    const initials = contact.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
    const globalIdx = startIdx + idx + 1;
    
    tr.innerHTML = `
      <td data-label="#">${globalIdx}</td>
      <td data-label="Name">
        <div class="table-identity">
          <div class="table-avatar">${initials}</div>
          <span style="font-weight:600">${escapeHtml(contact.name)}</span>
        </div>
      </td>
      <td data-label="Phone" class="td-mono">${escapeHtml(contact.phone || '-')}</td>
      <td data-label="Email" class="td-mono">${escapeHtml(contact.email || '-')}</td>
      <td data-label="Organisation">${escapeHtml(contact.org || '-')}</td>
      <td data-label="Saved">${formatRelativeTime(new Date(contact.savedAt))}</td>
      <td data-label="Actions">
        <div class="actions-cell">
          <button class="action-btn cyan-btn" onclick="exportSingleContactContext('${contact.id}')" title="Export Segment"><i class="fa-solid fa-download"></i></button>
          <button class="action-btn red-btn" onclick="requestMicroConfirmation(event, '${contact.id}')" title="Wipe Segment"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    `;
    
    tbody.appendChild(tr);
    
    // Staggered visualization interpolation entry arrays
    setTimeout(() => {
      tr.style.transition = `all 0.4s var(--ease-spring)`;
      tr.style.opacity = '1';
      tr.style.transform = 'translateY(0)';
    }, idx * 60);
  });
  
  renderPaginationControls(total, perPage, currPage);
}

function renderPaginationControls(total, perPage, currPage) {
  const wrapper = document.getElementById('pagination-wrapper');
  if(!wrapper) return;
  
  const pageCount = Math.ceil(total / perPage);
  if(pageCount <= 1) {
    wrapper.classList.add('hidden');
    return;
  }
  
  wrapper.classList.remove('hidden');
  wrapper.innerHTML = '';
  
  const prevBtn = document.createElement('button');
  prevBtn.className = 'page-pill';
  prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
  prevBtn.disabled = currPage === 1;
  prevBtn.addEventListener('click', () => {
    State.pagination.currentPage--;
    renderTablePage();
  });
  wrapper.appendChild(prevBtn);
  
  for(let i=1; i<=pageCount; i++) {
    const pill = document.createElement('button');
    pill.className = `page-pill ${i === currPage ? 'active' : ''}`;
    pill.textContent = i;
    pill.addEventListener('click', () => {
      State.pagination.currentPage = i;
      renderTablePage();
    });
    wrapper.appendChild(pill);
  }
  
  const nextBtn = document.createElement('button');
  nextBtn.className = 'page-pill';
  nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
  nextBtn.disabled = currPage === pageCount;
  nextBtn.addEventListener('click', () => {
    State.pagination.currentPage++;
    renderTablePage();
  });
  wrapper.appendChild(nextBtn);
}

// 12. EXPORT AND SINGLE INTEGRATION LOOPS
function exportSingleContactContext(id) {
  const match = State.contacts.find(c => c.id === id);
  if(!match) return;
  
  let vcard = match.raw;
  // Reconstruct card model parameters if context maps demand normal form serialization
  if(!vcard || !vcard.startsWith('BEGIN:VCARD')) {
    vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${match.name}\nTEL;TYPE=CELL:${match.phone}\nEMAIL:${match.email}\nORG:${match.org}\nEND:VCARD`;
  }
  
  executeBlobDownload(vcard, `${match.name.replace(/\s+/g, '_')}-beltah.vcf`);
  showToast('Single node serialization complete', 'success');
}

function triggerExportAllEngine() {
  if(State.contacts.length === 0) {
    showToast('No record metrics present to pass into context stream', 'warning');
    return;
  }
  
  let megaStream = '';
  State.contacts.forEach(c => {
    if(c.raw) {
      megaStream += c.raw.trim() + '\n';
    } else {
      megaStream += `BEGIN:VCARD\nVERSION:3.0\nFN:${c.name}\nTEL;TYPE=CELL:${c.phone}\nEMAIL:${c.email}\nORG:${c.org}\nEND:VCARD\n`;
    }
  });
  
  executeBlobDownload(megaStream, `beltah_master_export_${Date.now()}.vcf`);
  showToast(`Bulk serialization sequence generated explicitly for ${State.contacts.length} objects`, 'success');
}

function executeBlobDownload(textStr, filename) {
  const blob = new Blob([textStr], { type: 'text/vcard;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

// 13. DATA TRUNCATION AND CONFIRMATION INTERFACES
function requestMicroConfirmation(event, id) {
  event.stopPropagation();
  const targetBtn = event.currentTarget;
  
  // Close any legacy dangling confirmation parameters safely
  dismissActiveConfirmationOverlays();
  
  const popover = document.createElement('div');
  popover.className = 'confirm-popover';
  popover.id = 'active-popover';
  popover.innerHTML = `
    <span>Are you sure?</span>
    <div class="popover-buttons">
      <button class="popover-btn popover-confirm" onclick="commitSingleRecordWipe('${id}')">Yes</button>
      <button class="popover-btn popover-cancel" onclick="dismissActiveConfirmationOverlays()">No</button>
    </div>
  `;
  
  targetBtn.parentElement.appendChild(popover);
}

function dismissActiveConfirmationOverlays() {
  const active = document.getElementById('active-popover');
  if(active) active.parentElement.removeChild(active);
}

function commitSingleRecordWipe(id) {
  State.contacts = State.contacts.filter(c => c.id !== id);
  localStorage.setItem(CONFIG.STORAGE_PREFIX + 'vcf_contacts', JSON.stringify(State.contacts));
  showToast('Segment record purged from mapping dictionary', 'info');
  updateGlobalCounters();
  calculateMetrics();
  filterAndRenderTable();
}

function triggerWipeSequence(btnSource) {
  // Leverage internal lightbox framework interface elements
  const modal = document.getElementById('lightbox-modal');
  if(!modal) return;
  
  modal.innerHTML = `
    <div class="gate-card" style="margin: 15vh auto; max-width: 460px;">
      <div class="gate-icon-wrapper" style="background: rgba(239,68,68,0.1); box-shadow: 0 0 30px rgba(239,68,68,0.15)">
        <i class="fa-solid fa-triangle-exclamation" style="color:var(--accent-red); font-size:30px;"></i>
      </div>
      <h2>Destructive Action Alert</h2>
      <p>This will purge the local browser allocation table completely. This transformation cannot be undone.</p>
      <div style="display:flex; gap:12px; width:100%;">
        <button id="modal-confirm-wipe" class="btn-primary" style="background:var(--accent-red); margin:0;">Wipe Storage Matrix</button>
        <button id="modal-cancel-wipe" class="btn-primary" style="background:rgba(255,255,255,0.05); border:1px solid var(--border-subtle); color:white; margin:0;">Abort</button>
      </div>
    </div>
  `;
  modal.hidden = false;
  
  document.getElementById('modal-cancel-wipe').addEventListener('click', () => modal.hidden = true);
  document.getElementById('modal-confirm-wipe').addEventListener('click', () => {
    State.contacts = [];
    localStorage.setItem(CONFIG.STORAGE_PREFIX + 'vcf_contacts', JSON.stringify([]));
    showToast('All contact indexes unlinked successfully', 'info');
    updateGlobalCounters();
    calculateMetrics();
    filterAndRenderTable();
    modal.hidden = true;
  });
}

// 14. TOAST METRIC COMPONENT STACK
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  // Maintain system guardrails by enforcing max concurrency thresholds
  const activeToasts = container.querySelectorAll('.toast');
  if (activeToasts.length >= CONFIG.MAX_TOASTS) {
    activeToasts[0].parentElement.removeChild(activeToasts[0]);
  }
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let iconClass = 'fa-circle-check';
  if(type === 'error') iconClass = 'fa-circle-xmark';
  if(type === 'warning') iconClass = 'fa-triangle-exclamation';
  if(type === 'info') iconClass = 'fa-circle-info';
  
  toast.innerHTML = `
    <i class="fa-solid ${iconClass} toast-icon"></i>
    <div class="toast-content">
      <div class="toast-msg">${escapeHtml(message)}</div>
    </div>
    <button class="toast-close"><i class="fa-solid fa-xmark"></i></button>
    <div class="toast-progress"></div>
  `;
  
  container.appendChild(toast);
  
  // Reflow force initialization for animation profiles
  void toast.offsetWidth;
  toast.classList.add('toast-show');
  
  const prog = toast.querySelector('.toast-progress');
  if(prog) {
    prog.style.transition = 'transform 4000ms linear';
    prog.style.transform = 'scaleX(0)';
  }
  
  const dismissTimeout = setTimeout(() => dismissToast(toast), 4000);
  
  toast.querySelector('.toast-close').addEventListener('click', () => {
    clearTimeout(dismissTimeout);
    dismissToast(toast);
  });
}

function dismissToast(toast) {
  toast.style.transform = 'translateX(110%)';
  toast.style.transition = `all 0.3s var(--ease-snap)`;
  setTimeout(() => {
    if(toast.parentElement) toast.parentElement.removeChild(toast);
  }, 300);
}

// 15. KEYBOARD LISTENERS & SANITIZATION LAYER
function setupKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? e.metaKey : e.ctrlKey;
    
    // Ctrl/Cmd + K
    if (modifier && e.key.toLowerCase() === 'k') {
      if (State.isAuthenticated && State.activeView === 'admin-view') {
        e.preventDefault();
        document.getElementById('table-search')?.focus();
      }
    }
    
    // Escape
    if (e.key === 'Escape') {
      dismissActiveConfirmationOverlays();
      const modal = document.getElementById('lightbox-modal');
      if (modal) modal.hidden = true;
    }
    
    // Ctrl/Cmd + S
    if (modifier && e.key.toLowerCase() === 's') {
      if (State.activeView === 'tool-view' && State.parsedCache) {
        e.preventDefault();
        document.getElementById('save-vcf-btn')?.click();
      }
    }
    
    // Ctrl/Cmd + E
    if (modifier && e.key.toLowerCase() === 'e') {
      if (State.isAuthenticated && State.activeView === 'admin-view') {
        e.preventDefault();
        triggerExportAllEngine();
      }
    }
  });
}

function escapeHtml(str) {
  if(!str) return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}
