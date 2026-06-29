(function () {
  'use strict';

  // --- Accent Palette Config ---
  const PALETTE = ['#7c3aed', '#06b6d4', '#3b82f6', '#a855f7', '#f472b6', '#4ade80'];

  // --- Canvas Background Loop Controllers ---
  let auroraCtx = null;
  let gridCtx = null;
  let auroraRafId = null;
  let gridRafId = null;
  let auroraOrbs = [];
  let gridVanishingXOffset = 0;
  let gridLineOffset = 0;

  // --- Local Data Memory Layers ---
  let memoryRecords = [];
  let currentActivePage = 1;
  const ITEMS_PER_PAGE = 15;

  // --- DOM Element Reference Tree ---
  const els = {
    aurora: document.getElementById('aurora'),
    grid: document.getElementById('grid-canvas'),
    particles: document.getElementById('particle-field'),
    topbar: document.getElementById('main-topbar'),
    pillCollect: document.getElementById('pill-collect'),
    pillCommunity: document.getElementById('pill-community'),
    hamburger: document.getElementById('mobile-hamburger'),
    mobileMenu: document.getElementById('mobile-menu'),
    heroCounter: document.getElementById('hero-counter-num'),
    verifiedCounter: document.getElementById('community-verified-count'),
    cardWrapper: document.getElementById('contact-form-card'),
    form: document.getElementById('vcf-collection-form'),
    fName: document.getElementById('input-first-name'),
    lName: document.getElementById('input-last-name'),
    dial: document.getElementById('input-country-dial'),
    phone: document.getElementById('input-phone'),
    submitBtn: document.getElementById('submit-btn-element'),
    publicGrid: document.getElementById('public-cards-wrapper'),
    triggerAdmin: document.getElementById('trigger-admin'),
    triggerAdminMob: document.getElementById('trigger-admin-mobile'),
    adminOverlay: document.getElementById('admin-panel-overlay'),
    closeAdmin: document.getElementById('close-admin-btn'),
    gateCard: document.getElementById('admin-gate-card'),
    gatePass: document.getElementById('admin-pass-input'),
    togglePass: document.getElementById('toggle-gate-pass'),
    submitGate: document.getElementById('submit-gate-btn'),
    gateErr: document.getElementById('admin-gate-err'),
    dashContainer: document.getElementById('admin-dashboard-container'),
    lockSession: document.getElementById('action-lock-session'),
    mTotal: document.getElementById('metric-total-members'),
    mToday: document.getElementById('metric-joined-today'),
    mVcfSize: document.getElementById('metric-vcf-size'),
    mLastTime: document.getElementById('metric-last-time'),
    masterSub: document.getElementById('master-vcf-subtext'),
    masterTimestamp: document.getElementById('master-vcf-timestamp'),
    downloadMaster: document.getElementById('action-download-master'),
    triggerDelVcf: document.getElementById('action-trigger-delete-vcf'),
    popDelVcf: document.getElementById('popover-delete-vcf'),
    cancelDelVcf: document.getElementById('btn-cancel-del-vcf'),
    confirmDelVcf: document.getElementById('btn-confirm-del-vcf'),
    tableBadge: document.getElementById('table-total-badge'),
    search: document.getElementById('table-search-input'),
    sort: document.getElementById('table-sort-select'),
    exportAll: document.getElementById('action-export-all-vcf'),
    triggerClearAll: document.getElementById('action-trigger-clear-all'),
    popClearAll: document.getElementById('popover-clear-all'),
    cancelClearAll: document.getElementById('btn-cancel-clear-all'),
    confirmClearAll: document.getElementById('btn-confirm-clear-all'),
    tableBody: document.getElementById('table-data-rows-hook'),
    tableEmpty: document.getElementById('table-empty-state'),
    pagination: document.getElementById('table-pagination-controls'),
    toastStack: document.getElementById('toast-stack-container'),
    confetti: document.getElementById('confetti-canvas'),
    screenFlash: document.getElementById('screen-flash')
  };

  // --- Initialization Framework ---
  window.addEventListener('DOMContentLoaded', function () {
    initSVGDefinitions();
    loadRecordsFromDisk();
    evaluateMotionPreferences();
    setupGlobalNavigation();
    bindFormInteractivity();
    bindAdminPanelInteractivity();
    renderPublicGridWall();
    executeCountUpAnimation(els.heroCounter, memoryRecords.length, 1000);
    executeCountUpAnimation(els.verifiedCounter, memoryRecords.length, 1000);
  });

  function evaluateMotionPreferences() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    setupAuroraEngine();
    setupGridEngine();
    setupParticleFieldEngine();
  }

  function initSVGDefinitions() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.position = 'absolute';
    svg.style.width = '0';
    svg.style.height = '0';
    svg.innerHTML = `
      <defs>
        <linearGradient id="hex-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#7c3aed" />
          <stop offset="100%" stop-color="#22d3ee" />
        </linearGradient>
      </defs>
    `;
    document.body.appendChild(svg);
  }

  // --- Storage & Memory Logic Engine ---
  function loadRecordsFromDisk() {
    try {
      const stored = localStorage.getItem('beltah_contacts');
      memoryRecords = stored ? JSON.parse(stored) : [];
    } catch (e) {
      memoryRecords = [];
    }
  }

  function syncRecordsToDisk() {
    localStorage.setItem('beltah_contacts', JSON.stringify(memoryRecords));
    rebuildMasterVCFString();
  }

  function rebuildMasterVCFString() {
    let output = '';
    memoryRecords.forEach(function (rec) {
      output += 'BEGIN:VCARD\r\nVERSION:3.0\r\n';
      output += 'FN:' + rec.fullName + '\r\n';
      output += 'N:' + rec.lastName + ';' + rec.firstName + ';;;\r\n';
      output += 'TEL;TYPE=CELL:' + rec.phone + '\r\n';
      output += 'X-COUNTRY:' + rec.country + '\r\n';
      output += 'X-JOINED:' + rec.joinedAt + '\r\n';
      output += 'END:VCARD\r\n\r\n';
    });
    localStorage.setItem('beltah_vcf_master', output.trim());
  }

  // --- Component: Aurora Ambient Engine ---
  function setupAuroraEngine() {
    auroraCtx = els.aurora.getContext('2d');
    resizeAuroraCanvas();
    window.addEventListener('resize', resizeAuroraCanvas);

    for (let i = 0; i < 8; i++) {
      auroraOrbs.push({
        x: Math.random() * els.aurora.width,
        y: Math.random() * els.aurora.height,
        r: Math.random() * 320 + 280,
        color: PALETTE[i % PALETTE.length],
        angleX: Math.random() * Math.PI * 2,
        angleY: Math.random() * Math.PI * 2,
        speedX: Math.random() * 0.0005 + 0.0003,
        speedY: Math.random() * 0.0005 + 0.0003
      });
    }

    let lastTime = 0;
    function loop(now) {
      auroraRafId = requestAnimationFrame(loop);
      if (now - lastTime < 33.33) return; // Cap at 30 FPS
      lastTime = now;

      auroraCtx.fillStyle = '#020308';
      auroraCtx.fillRect(0, 0, els.aurora.width, els.aurora.height);

      auroraOrbs.forEach(function (orb) {
        orb.angleX += orb.speedX;
        orb.angleY += orb.speedY;

        const cx = els.aurora.width / 2;
        const cy = els.aurora.height / 2;

        orb.x = cx + Math.sin(orb.angleX) * (cx * 0.7);
        orb.y = cy + Math.cos(orb.angleY) * (cy * 0.7);

        const grad = auroraCtx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
        grad.addColorStop(0, hexToRgbA(orb.color, 0.12));
        grad.addColorStop(1, 'transparent');

        auroraCtx.fillStyle = grad;
        auroraCtx.beginPath();
        auroraCtx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        auroraCtx.fill();
      });
    }
    auroraRafId = requestAnimationFrame(loop);
  }

  function resizeAuroraCanvas() {
    els.aurora.width = window.innerWidth;
    els.aurora.height = window.innerHeight;
  }

  // --- Component: Reactive Depth Grid Engine ---
  function setupGridEngine() {
    gridCtx = els.grid.getContext('2d');
    resizeGridCanvas();
    window.addEventListener('resize', resizeGridCanvas);

    window.addEventListener('mousemove', function (e) {
      const normalizedX = (e.clientX / window.innerWidth) - 0.5;
      gridVanishingXOffset = normalizedX * 60; // ±30px deflection range
    });

    function loop() {
      gridRafId = requestAnimationFrame(loop);
      gridCtx.clearRect(0, 0, els.grid.width, els.grid.height);

      gridCtx.strokeStyle = 'rgba(99, 102, 241, 0.06)';
      gridCtx.lineWidth = 1;

      const vanishingX = (els.grid.width / 2) + gridVanishingXOffset;
      const vanishingY = els.grid.height * 0.85;

      gridLineOffset = (gridLineOffset + 0.3) % 40;

      // Vertical Ray Projections
      const rayCount = 36;
      for (let i = 0; i <= rayCount; i++) {
        const angle = (Math.PI / rayCount) * i;
        const startX = vanishingX + Math.cos(angle) * els.grid.width * 2;
        const startY = vanishingY + Math.sin(angle) * els.grid.width * 2;
        gridCtx.beginPath();
        gridCtx.moveTo(vanishingX, vanishingY);
        gridCtx.lineTo(startX, startY);
        gridCtx.stroke();
      }

      // Horizontal Floor Contours
      const horizonLineCount = 20;
      for (let i = 0; i < horizonLineCount; i++) {
        const currentY = vanishingY + Math.pow(i / horizonLineCount, 2) * (els.grid.height - vanishingY) + gridLineOffset;
        if (currentY > els.grid.height || currentY < vanishingY) continue;
        gridCtx.beginPath();
        gridCtx.moveTo(0, currentY);
        gridCtx.lineTo(els.grid.width, currentY);
        gridCtx.stroke();
      }
    }
    gridRafId = requestAnimationFrame(loop);
  }

  function resizeGridCanvas() {
    els.grid.width = window.innerWidth;
    els.grid.height = window.innerHeight;
  }

  // --- Component: Floating Micro-Particle System ---
  function setupParticleFieldEngine() {
    const particleCount = 120;
    const trackingNodes = [];

    for (let i = 0; i < particleCount; i++) {
      const el = document.createElement('div');
      el.className = 'particle';

      const size = Math.floor(Math.random() * 3) + 1;
      const initX = Math.random() * 100;
      const initY = Math.random() * 100;
      const col = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      const opacity = (Math.random() * 0.35 + 0.15).toFixed(2);
      const floatDuration = Math.random() * 12 + 8;
      const delay = -(Math.random() * 20);

      el.style.width = size + px();
      el.style.height = size + px();
      el.style.backgroundColor = col;
      el.style.opacity = opacity;
      el.style.left = initX + '%';
      el.style.top = initY + '%';

      const keyframeName = 'part-float-' + i;
      const keyframes = `
        @keyframes ${keyframeName} {
          0% { transform: translateY(0vh) translateX(0px); }
          50% { transform: translateY(-50vh) translateX(${(Math.random() * 40 - 20).toFixed(1)}px); }
          100% { transform: translateY(-100vh) translateX(0px); }
        }
      `;
      injectDynamicCSSKeyframe(keyframes);

      el.style.animation = `${keyframeName} ${floatDuration}s linear ${delay}s infinite, twinkle 4s ease-in-out infinite`;
      els.particles.appendChild(el);

      trackingNodes.push({
        dom: el,
        baseX: window.innerWidth * (initX / 100),
        baseY: window.innerHeight * (initY / 100),
        currentX: window.innerWidth * (initX / 100),
        currentY: window.innerHeight * (initY / 100)
      });
    }

    window.addEventListener('resize', function () {
      trackingNodes.forEach(function (node) {
        const pctX = parseFloat(node.dom.style.left) / 100;
        const pctY = parseFloat(node.dom.style.top) / 100;
        node.baseX = window.innerWidth * pctX;
        node.baseY = window.innerHeight * pctY;
      });
    });

    window.addEventListener('mousemove', function (e) {
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      const repulsionRadius = 80;

      trackingNodes.forEach(function (node) {
        const rect = node.dom.getBoundingClientRect();
        const nodeX = rect.left + rect.width / 2;
        const nodeY = rect.top + rect.height / 2;

        const dx = nodeX - mouseX;
        const dy = nodeY - mouseY;
        const distance = Math.hypot(dx, dy);

        if (distance < repulsionRadius && distance > 0) {
          const force = (repulsionRadius - distance) / repulsionRadius;
          const pushX = (dx / distance) * force * 35;
          const pushY = (dy / distance) * force * 35;
          node.dom.style.transform = `translate3d(${pushX}px, ${pushY}px, 0)`;
        } else {
          node.dom.style.transform = '';
        }
      });
    });
  }

  // --- Component: High Performance Confetti Engine ---
  function triggerConfettiBurst(originX, originY) {
    const ctx = els.confetti.getContext('2d');
    els.confetti.width = window.innerWidth;
    els.confetti.height = window.innerHeight;

    const particles = [];
    const count = 200;
    const shapes = ['rect', 'circle', 'line'];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: originX,
        y: originY,
        size: Math.random() * 6 + 4,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        vx: (Math.random() * 16 - 8),
        vy: (Math.random() * -10 - 4),
        gravity: 0.35,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: Math.random() * 0.2 - 0.1,
        opacity: 1,
        life: 1
      });
    }

    function run() {
      let active = false;
      ctx.clearRect(0, 0, els.confetti.width, els.confetti.height);

      particles.forEach(function (p) {
        if (p.opacity <= 0) return;
        active = true;

        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.life -= 0.009;
        p.opacity = Math.max(0, p.life);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = hexToRgbA(p.color, p.opacity);
        ctx.strokeStyle = hexToRgbA(p.color, p.opacity);
        ctx.lineWidth = 2;

        ctx.beginPath();
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else if (p.shape === 'circle') {
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.moveTo(-p.size / 2, 0);
          ctx.lineTo(p.size / 2, 0);
          ctx.stroke();
        }
        ctx.restore();
      });

      if (active) {
        requestAnimationFrame(run);
      } else {
        ctx.clearRect(0, 0, els.confetti.width, els.confetti.height);
      }
    }
    requestAnimationFrame(run);
  }

  // --- Navigation & Core UI Interfaces ---
  function setupGlobalNavigation() {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 80) {
        els.topbar.classList.add('scrolled');
      } else {
        els.topbar.classList.remove('scrolled');
      }
    });

    els.hamburger.addEventListener('click', function () {
      els.mobileMenu.classList.toggle('open');
    });

    document.querySelectorAll('.mobile-nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        els.mobileMenu.classList.remove('open');
      });
    });

    if ('IntersectionObserver' in window) {
      const observerOptions = { root: null, threshold: 0.4 };
      const sections = [
        { id: 'hero-section', pill: els.pillCollect },
        { id: 'community-section', pill: els.pillCommunity }
      ];

      sections.forEach(function (sec) {
        const target = document.getElementById(sec.id);
        if (!target) return;
        const observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              sections.forEach(s => s.pill.classList.remove('active'));
              sec.pill.classList.add('active');
            }
          });
        }, observerOptions);
        observer.observe(target);
      });
    }
  }

  // --- Collection Form Architecture ---
  function bindFormInteractivity() {
    const inputs = [els.fName, els.lName, els.phone];

    inputs.forEach(function (input) {
      input.addEventListener('blur', function () {
        validateField(input);
      });
      input.addEventListener('input', function () {
        clearFieldErrors(input);
      });
    });

    els.dial.addEventListener('change', function () {
      if (els.phone.value.trim() !== '') {
        validateField(els.phone);
      }
    });

    els.form.addEventListener('submit', function (e) {
      e.preventDefault();
      let formValid = true;

      inputs.forEach(function (input) {
        if (!validateField(input)) {
          formValid = false;
        }
      });

      if (!formValid) {
        showToast('Please correct validation errors before submitting.', 'error');
        return;
      }

      executeFormSubmissionSequence();
    });
  }

  function validateField(input) {
    const group = input.closest('.field-group');
    const val = input.value.trim();

    if (input === els.fName || input === els.lName) {
      if (val === '') {
        group.classList.remove('is-valid');
        group.classList.add('has-error');
        return false;
      } else {
        group.classList.remove('has-error');
        group.classList.add('is-valid');
        return true;
      }
    }

    if (input === els.phone) {
      const combined = (els.dial.value + val).replace(/\D/g, '');
      if (combined.length < 8 || combined.length > 15) {
        group.classList.remove('is-valid');
        group.classList.add('has-error');
        return false;
      } else {
        group.classList.remove('has-error');
        group.classList.add('is-valid');
        return true;
      }
    }
    return true;
  }

  function clearFieldErrors(input) {
    const group = input.closest('.field-group');
    group.classList.remove('has-error');
  }

  function executeFormSubmissionSequence() {
    els.submitBtn.disabled = true;
    const originalContent = els.submitBtn.innerHTML;
    els.submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...';

    setTimeout(function () {
      const rawPhone = els.phone.value.trim().replace(/\D/g, '');
      const selectedDial = els.dial.value;
      const fullFormattedPhone = selectedDial + rawPhone;
      const selectedOptionText = els.dial.options[els.dial.selectedIndex].text;
      const countryExtracted = selectedOptionText.split(' ')[0].trim();

      const newRecord = {
        id: generateUUIDv4(),
        firstName: sanitizeInput(els.fName.value),
        lastName: sanitizeInput(els.lName.value),
        fullName: sanitizeInput(els.fName.value + ' ' + els.lName.value),
        phone: fullFormattedPhone,
        dialCode: selectedDial,
        country: countryExtracted,
        joinedAt: new Date().toISOString(),
        submittedAt: formatDisplayDate(new Date())
      };

      memoryRecords.unshift(newRecord);
      syncRecordsToDisk();

      // Celebration Step 1: Canvas Confetti Blast
      const btnRect = els.submitBtn.getBoundingClientRect();
      triggerConfettiBurst(btnRect.left + btnRect.width / 2, btnRect.top + btnRect.height / 2);

      // Celebration Step 3: Screen Pulse Flash
      els.screenFlash.style.background = 'rgba(124, 58, 237, 0.12)';
      setTimeout(() => els.screenFlash.style.background = 'rgba(124, 58, 237, 0)', 400);

      // Celebration Step 4: Toast Trigger
      showToast('Contact saved! Check the community section below.', 'success');

      // Celebration Step 5: Ticker Counters Increment
      const currentCount = memoryRecords.length - 1;
      executeCountUpAnimation(els.heroCounter, memoryRecords.length, 800, currentCount);
      executeCountUpAnimation(els.verifiedCounter, memoryRecords.length, 800, currentCount);

      // Celebration Step 2: Form Interface Transformation
      els.cardWrapper.style.transform = 'scale(0.96)';
      els.cardWrapper.style.opacity = '0.6';

      setTimeout(function () {
        els.cardWrapper.innerHTML = `
          <div class="success-state-container">
            <div class="success-checkmark-box">
              <svg class="success-svg" viewBox="0 0 50 50">
                <circle cx="25" cy="25" r="23" />
                <path d="M14 27 l7 7 l16 -16" />
              </svg>
            </div>
            <h3>You're In! 🎉</h3>
            <p>Contact saved successfully. Welcome to the Beltah Network, ${newRecord.firstName}!</p>
            <div class="success-action-buttons-stack">
              <a href="#group-link" class="btn-success-primary">
                <i class="fa-brands fa-whatsapp"></i> Join Our Community Group
              </a>
              <button class="btn-success-secondary" id="action-reset-form-card">
                <i class="fa-solid fa-rotate-left"></i> Add Another Contact
              </button>
            </div>
          </div>
        `;
        els.cardWrapper.style.transform = 'scale(1)';
        els.cardWrapper.style.opacity = '1';

        document.getElementById('action-reset-form-card').addEventListener('click', function () {
          location.reload();
        });

        // Celebration Step 6: Focus Viewport Shift + Highlights
        setTimeout(function () {
          const publicWallSection = document.getElementById('community-section');
          if (publicWallSection) {
            publicWallSection.scrollIntoView({ behavior: 'smooth' });
            setTimeout(function () {
              const freshCard = els.publicGrid.firstElementChild;
              if (freshCard) {
                freshCard.classList.add('highlight-pulse');
              }
            }, 800);
          }
        }, 1500);

      }, 400);

    }, 700);
  }

  // --- Component: Public Grid Renderer ---
  function renderPublicGridWall() {
    els.publicGrid.innerHTML = '';

    if (memoryRecords.length === 0) {
      const emp = document.createElement('div');
      emp.className = 'wall-empty-state';
      emp.innerHTML = `
        <svg class="empty-hex-grid" viewBox="0 0 100 100">
          <polygon points="50,10 90,32 90,78 50,90 10,78 10,32" />
          <polygon points="50,25 75,40 75,70 50,80 25,70 25,40" />
        </svg>
        <h4>Be the first to join!</h4>
        <p>Submit your details above to appear here.</p>
      `;
      els.publicGrid.appendChild(emp);
      return;
    }

    memoryRecords.forEach(function (rec, index) {
      const card = document.createElement('div');
      card.className = 'member-card';
      if (index === 0 && els.submitBtn.disabled) {
        card.classList.add('newly-added');
      }

      const initials = extractInitials(rec.firstName, rec.lastName);
      const avatarBg = generateStringColorHash(rec.fullName);

      card.innerHTML = `
        <div class="avatar-circle" style="background-color: ${avatarBg};">${initials}</div>
        <div class="member-name">${rec.fullName}</div>
        <div class="member-country">${rec.country}</div>
        <div class="member-phone-hidden">
          <i class="fa-solid fa-lock"></i> ● ● ● ● ● ●
        </div>
        <div class="member-joined-date">${calculateRelativeTime(rec.joinedAt)}</div>
      `;
      els.publicGrid.appendChild(card);
    });
  }

  // --- Control Panel Implementation Layer ---
  function bindAdminPanelInteractivity() {
    const openOverlay = function () {
      els.adminOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      if (sessionStorage.getItem('beltah_admin') === '1') {
        revealAdminDashboard();
      } else {
        revealAdminAuthGate();
      }
    };

    els.triggerAdmin.addEventListener('click', openOverlay);
    els.triggerAdminMob.addEventListener('click', openOverlay);

    els.closeAdmin.addEventListener('click', function () {
      els.adminOverlay.classList.remove('active');
      document.body.style.overflow = '';
      closeActiveAdminPopovers();
    });

    els.togglePass.addEventListener('click', function () {
      const type = els.gatePass.type === 'password' ? 'text' : 'password';
      els.gatePass.type = type;
      els.togglePass.innerHTML = type === 'password' ? '<i class="fa-regular fa-eye"></i>' : '<i class="fa-regular fa-eye-slash"></i>';
    });

    els.gatePass.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') executeAdminValidation();
    });
    els.submitGate.addEventListener('click', executeAdminValidation);

    els.lockSession.addEventListener('click', function () {
      sessionStorage.removeItem('beltah_admin');
      showToast('Admin session locked.', 'info');
      revealAdminAuthGate();
    });

    // Dash Operations Hook Matrix
    els.search.addEventListener('input', debounce(function () {
      currentActivePage = 1;
      renderAdminTableDataset();
    }, 200));

    els.sort.addEventListener('change', function () {
      currentActivePage = 1;
      renderAdminTableDataset();
    });

    els.downloadMaster.addEventListener('click', executeMasterVCFFileDownload);
    els.exportAll.addEventListener('click', executeMasterVCFFileDownload);

    // Popover Trigger Mechanisms
    setupPopoverToggle('action-trigger-delete-vcf', 'popover-delete-vcf');
    setupPopoverToggle('action-trigger-clear-all', 'popover-clear-all');

    els.cancelDelVcf.addEventListener('click', () => els.popDelVcf.classList.remove('active'));
    els.btnCancelClearAll = els.cancelClearAll; 
    els.btnCancelClearAll.addEventListener('click', () => els.popClearAll.classList.remove('active'));

    els.confirmDelVcf.addEventListener('click', function () {
      localStorage.removeItem('beltah_vcf_master');
      els.popDelVcf.classList.remove('active');
      showToast('Compiled master vCard string cleared.', 'warning');
      refreshAdminDashboardMetrics();
    });

    els.confirmClearAll.addEventListener('click', function () {
      memoryRecords = [];
      syncRecordsToDisk();
      els.popClearAll.classList.remove('active');
      showToast('All contact records wiped successfully.', 'error');
      currentActivePage = 1;
      refreshAdminDashboardMetrics();
      renderAdminTableDataset();
      renderPublicGridWall();
    });
  }

  function revealAdminAuthGate() {
    els.gateCard.classList.remove('dashboard-hidden');
    els.dashContainer.classList.add('dashboard-hidden');
    els.gatePass.value = '';
    els.gateErr.textContent = '';
    els.gateCard.classList.remove('gate-input-error');
  }

  function revealAdminDashboard() {
    els.gateCard.classList.add('dashboard-hidden');
    els.dashContainer.classList.remove('dashboard-hidden');
    refreshAdminDashboardMetrics();
    renderAdminTableDataset();
  }

  let gateFailures = 0;
  function executeAdminValidation() {
    const val = els.gatePass.value;
    if (val === 'Beltah@2026') {
      gateFailures = 0;
      sessionStorage.setItem('beltah_admin', '1');
      showToast('Access granted. Welcome admin.', 'success');
      revealAdminDashboard();
    } else {
      gateFailures++;
      els.gateCard.classList.add('gate-shake');
      els.gateCard.classList.add('gate-input-error');
      els.gateErr.textContent = '⚠ Access denied';
      setTimeout(function () {
        els.gateCard.classList.remove('gate-shake');
      }, 500);

      if (gateFailures >= 3) {
        executeGateLockoutProtocol();
      }
    }
  }

  function executeGateLockoutProtocol() {
    let countdown = 30;
    els.gatePass.disabled = true;
    els.submitGate.disabled = true;

    const timer = setInterval(function () {
      countdown--;
      els.gateErr.textContent = `Too many attempts. Try again in ${countdown}s`;
      if (countdown <= 0) {
        clearInterval(timer);
        els.gatePass.disabled = false;
        els.submitGate.disabled = false;
        els.gateErr.textContent = '';
        gateFailures = 0;
      }
    }, 1000);
  }

  function refreshAdminDashboardMetrics() {
    const total = memoryRecords.length;
    
    // Calculate Joined Today Records
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayCount = memoryRecords.filter(r => new Date(r.joinedAt) >= startOfToday).length;

    // Evaluate Blob Size metrics
    const masterString = localStorage.getItem('beltah_vcf_master') || '';
    const bytes = new Blob([masterString]).size;
    const sizeKB = (bytes / 1024).toFixed(2);

    els.mTotal.textContent = total;
    els.mToday.textContent = todayCount;
    els.mVcfSize.textContent = sizeKB + ' KB';
    els.mLastTime.textContent = total > 0 ? calculateRelativeTime(memoryRecords[0].joinedAt) : '--';

    els.masterSub.textContent = `Contains ${total} contacts · ${sizeKB} KB`;
    els.masterTimestamp.textContent = total > 0 ? `Last compiled: ${formatDisplayDate(new Date(memoryRecords[0].joinedAt))}` : 'Last updated: Never';
    els.tableBadge.textContent = total;
  }

  function renderAdminTableDataset() {
    closeActiveAdminPopovers();
    els.tableBody.innerHTML = '';

    let filtered = memoryRecords.filter(function (rec) {
      const q = els.search.value.toLowerCase();
      return rec.fullName.toLowerCase().includes(q) || rec.phone.includes(q) || rec.country.toLowerCase().includes(q);
    });

    // Sort Evaluation
    const sortVal = els.sort.value;
    if (sortVal === 'oldest') {
      filtered.sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt));
    } else if (sortVal === 'alpha') {
      filtered.sort((a, b) => a.fullName.localeCompare(b.fullName));
    } else {
      filtered.sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));
    }

    if (filtered.length === 0) {
      els.tableEmpty.classList.remove('container-hidden');
      els.tableEmpty.innerHTML = `<p style="color: var(--text-3); font-weight:600; font-size:14px;">No contacts found matching criteria.</p>`;
      els.pagination.innerHTML = '';
      return;
    }
    els.tableEmpty.classList.add('container-hidden');

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    if (currentActivePage > totalPages) currentActivePage = Math.max(1, totalPages);

    const startIndex = (currentActivePage - 1) * ITEMS_PER_PAGE;
    const slice = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    slice.forEach(function (rec, loopIndex) {
      const globalIndex = startIndex + loopIndex + 1;
      const tr = document.createElement('tr');
      tr.style.opacity = '0';
      tr.style.transform = 'translateY(8px)';

      const initials = extractInitials(rec.firstName, rec.lastName);
      const avatarBg = generateStringColorHash(rec.fullName);

      tr.innerHTML = `
        <td data-label="#">${globalIndex}</td>
        <td data-label="Avatar">
          <div class="dash-avatar-circle" style="background-color: ${avatarBg};">${initials}</div>
        </td>
        <td data-label="Full Name" class="table-cell-bold-white">${rec.fullName}</td>
        <td data-label="Phone" class="table-cell-mono-cyan">${rec.phone}</td>
        <td data-label="Country">${rec.country}</td>
        <td data-label="Joined">${calculateRelativeTime(rec.joinedAt)}</td>
        <td data-label="Actions">
          <div class="row-action-buttons">
            <button class="btn-row-action action-row-cyan" data-id="${rec.id}" title="Export Individual vCard" onclick="window.BeltahAdminRouter.exportSingleVCF('${rec.id}')">
              <i class="fa-solid fa-id-card"></i>
            </button>
            <div class="popover-wrapper">
              <button class="btn-row-action action-row-red" title="Delete Contact" onclick="window.BeltahAdminRouter.triggerRowPopover(event, '${rec.id}')">
                <i class="fa-solid fa-user-xmark"></i>
              </button>
              <div class="inline-popover-confirm popover-aligned-right" id="popover-row-${rec.id}">
                <p>Remove ${rec.firstName} from contacts?</p>
                <div class="popover-buttons">
                  <button class="pop-btn-cancel" onclick="window.BeltahAdminRouter.closeRowPopover(event, '${rec.id}')">Cancel</button>
                  <button class="pop-btn-confirm pop-red" onclick="window.BeltahAdminRouter.confirmRowDeletion('${rec.id}')">Delete</button>
                </div>
              </div>
            </div>
          </div>
        </td>
      `;

      els.tableBody.appendChild(tr);
      setTimeout(function () {
        tr.style.transition = 'opacity 0.3s var(--ease-spring), transform 0.3s var(--ease-spring)';
        tr.style.opacity = '1';
        tr.style.transform = 'translateY(0)';
      }, loopIndex * 40);
    });

    renderTablePaginationControls(filtered.length, totalPages);
  }

  function renderTablePaginationControls(totalItems, totalPages) {
    els.pagination.innerHTML = '';
    if (totalPages <= 1) return;

    const info = document.createElement('div');
    info.className = 'pagination-info';
    const start = (currentActivePage - 1) * ITEMS_PER_PAGE + 1;
    const end = Math.min(currentActivePage * ITEMS_PER_PAGE, totalItems);
    info.textContent = `Showing ${start}-${end} of ${totalItems} items`;
    els.pagination.appendChild(info);

    const pillsContainer = document.createElement('div');
    pillsContainer.className = 'pagination-controls-pills';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'btn-pag-pill';
    prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
    prevBtn.disabled = currentActivePage === 1;
    prevBtn.addEventListener('click', () => { currentActivePage--; renderAdminTableDataset(); });
    pillsContainer.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
      const pill = document.createElement('button');
      pill.className = 'btn-pag-pill' + (i === currentActivePage ? ' pag-active' : '');
      pill.textContent = i;
      pill.addEventListener('click', () => { currentActivePage = i; renderAdminTableDataset(); });
      pillsContainer.appendChild(pill);
    }

    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn-pag-pill';
    nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
    nextBtn.disabled = currentActivePage === totalPages;
    nextBtn.addEventListener('click', () => { currentActivePage++; renderAdminTableDataset(); });
    pillsContainer.appendChild(nextBtn);

    els.pagination.appendChild(pillsContainer);
  }

  function executeMasterVCFFileDownload() {
    const data = localStorage.getItem('beltah_vcf_master') || '';
    if (data.trim() === '') {
      showToast('No contact records compiled to export.', 'warning');
      return;
    }
    const blob = new Blob([data], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `Beltah-Contacts-${dStr}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Master VCF database downloaded.', 'success');
  }

  // --- Externalized Global Event Route Routers ---
  window.BeltahAdminRouter = {
    exportSingleVCF: function (id) {
      const rec = memoryRecords.find(r => r.id === id);
      if (!rec) return;
      let vcf = 'BEGIN:VCARD\r\nVERSION:3.0\r\n';
      vcf += `FN:${rec.fullName}\r\n`;
      vcf += `N:${rec.lastName};${rec.firstName};;;\r\n`;
      vcf += `TEL;TYPE=CELL:${rec.phone}\r\n`;
      vcf += `X-COUNTRY:${rec.country}\r\n`;
      vcf += `X-JOINED:${rec.joinedAt}\r\n`;
      vcf += 'END:VCARD';

      const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${rec.firstName}-${rec.lastName}.vcf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`vCard for ${rec.firstName} downloaded.`, 'success');
    },
    triggerRowPopover: function (e, id) {
      e.stopPropagation();
      closeActiveAdminPopovers();
      const pop = document.getElementById(`popover-row-${id}`);
      if (pop) pop.classList.add('active');
    },
    closeRowPopover: function (e, id) {
      e.stopPropagation();
      const pop = document.getElementById(`popover-row-${id}`);
      if (pop) pop.classList.remove('active');
    },
    confirmRowDeletion: function (id) {
      memoryRecords = memoryRecords.filter(r => r.id !== id);
      syncRecordsToDisk();
      showToast('Contact removed successfully.', 'warning');
      refreshAdminDashboardMetrics();
      renderAdminTableDataset();
      renderPublicGridWall();
    }
  };

  // --- Infrastructure Utility Subsystem ---
  function showToast(message, type = 'success', duration = 4000) {
    if (els.toastStack.children.length >= 4) {
      const oldest = els.toastStack.firstElementChild;
      if (oldest) removeToastNode(oldest);
    }

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;

    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-circle-exclamation';
    if (type === 'warning') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `
      <div class="toast-content-wrapper">
        <i class="fa-solid ${icon} toast-icon"></i>
        <span class="toast-msg">${message}</span>
      </div>
      <button class="toast-close-btn" aria-label="Dismiss Toast"><i class="fa-solid fa-xmark"></i></button>
      <div class="toast-progress-bar" style="animation-duration: ${duration}ms;"></div>
    `;

    els.toastStack.appendChild(toast);

    const closeBtn = toast.querySelector('.toast-close-btn');
    closeBtn.addEventListener('click', () => removeToastNode(toast));

    const autoTimer = setTimeout(() => {
      removeToastNode(toast);
    }, duration);

    toast.dataset.timerId = autoTimer;
  }

  function removeToastNode(toast) {
    if (toast.classList.contains('toast-closing')) return;
    if (toast.dataset.timerId) clearTimeout(parseInt(toast.dataset.timerId, 10));
    toast.classList.add('toast-closing');
    toast.addEventListener('animationend', function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    });
  }

  function setupPopoverToggle(triggerId, popoverId) {
    const trigger = document.getElementById(triggerId);
    const popover = document.getElementById(popoverId);
    if (!trigger || !popover) return;

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      const state = popover.classList.contains('active');
      closeActiveAdminPopovers();
      if (!state) popover.classList.add('active');
    });

    popover.addEventListener('click', (e) => e.stopPropagation());
  }

  function closeActiveAdminPopovers() {
    document.querySelectorAll('.inline-popover-confirm').forEach(p => p.classList.remove('active'));
  }

  document.addEventListener('click', closeActiveAdminPopovers);

  function executeCountUpAnimation(targetEl, finalValue, duration = 1000, initialValue = 0) {
    if (!targetEl) return;
    let startTimestamp = null;
    function renderStep(timestamp) {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease out
      const current = Math.floor(easeProgress * (finalValue - initialValue) + initialValue);
      targetEl.textContent = current;
      if (progress < 1) {
        requestAnimationFrame(renderStep);
      } else {
        targetEl.textContent = finalValue;
      }
    }
    requestAnimationFrame(renderStep);
  }

  function calculateRelativeTime(isoString) {
    const elapsed = new Date() - new Date(isoString);
    const msPerMinute = 60000;
    const msPerHour = 3600000;
    const msPerDay = 86400000;

    if (elapsed < msPerMinute) return 'Just now';
    if (elapsed < msPerHour) {
      const m = Math.floor(elapsed / msPerMinute);
      return `Joined ${m} minute${m > 1 ? 's' : ''} ago`;
    }
    if (elapsed < msPerDay) {
      const h = Math.floor(elapsed / msPerHour);
      return `Joined ${h} hour${h > 1 ? 's' : ''} ago`;
    }
    const d = Math.floor(elapsed / msPerDay);
    return `Joined ${d} day${d > 1 ? 's' : ''} ago`;
  }

  function generateStringColorHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % PALETTE.length;
    return PALETTE[index];
  }

  function extractInitials(f, l) {
    return ((f ? f.charAt(0) : '') + (l ? l.charAt(0) : '')).toUpperCase();
  }

  function generateUUIDv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function formatDisplayDate(dateObj) {
    const opts = { month: 'short', day: 'numeric', year: 'numeric' };
    const tOpts = { hour: '2-digit', minute: '2-digit', hour12: true };
    return dateObj.toLocaleDateString('en-US', opts) + ' · ' + dateObj.toLocaleTimeString('en-US', tOpts);
  }

  function sanitizeInput(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function injectDynamicCSSKeyframe(cssText) {
    const style = document.createElement('style');
    style.appendChild(document.createTextNode(cssText));
    document.head.appendChild(style);
  }

  function px() { return 'px'; }

}());
