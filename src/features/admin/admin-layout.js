// admin-layout.js — Shared sidebar + topbar for all admin pages
// Each page calls: AdminLayout.init({ activePage: 'dashboard', breadcrumb: 'Dashboard' })

const AdminLayout = (() => {

  const NAV_SECTIONS = [
    {
      label: 'Overview',
      items: [
        { page: 'dashboard',    icon: 'fas fa-th-large',       label: 'Dashboard' },
        { page: 'bookings',     icon: 'fas fa-calendar-check', label: 'Bookings', badge: true },
        { page: 'walkins',      icon: 'fas fa-walking',        label: 'Walk-ins' },
      ]
    },
    {
      label: 'Manage',
      items: [
        { page: 'services',     icon: 'fas fa-spray-can',      label: 'Services' },
        { page: 'availability', icon: 'fas fa-calendar-alt',   label: 'Availability' },
        { page: 'staff',        icon: 'fas fa-users',          label: 'Staff' },
      ]
    },
    {
      label: 'Reports',
      items: [
        { page: 'payments',     icon: 'fas fa-money-bill-wave', label: 'Payments' },
        { page: 'audit',        icon: 'fas fa-clipboard-list',  label: 'Audit Logs' },
      ]
    },
  ];

  function buildSidebar(activePage) {
    const navHTML = NAV_SECTIONS.map(section => `
      <div class="nav-section">
        <span class="nav-label">${section.label}</span>
        ${section.items.map(item => `
          <a href="/admin/${item.page}" class="nav-item ${item.page === activePage ? 'active' : ''}">
            <i class="${item.icon}"></i>
            <span>${item.label}</span>
            ${item.badge ? `<span class="nav-badge" id="pendingBadge">0</span>` : ''}
          </a>
        `).join('')}
      </div>
    `).join('');

    return `
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo"><i class="fas fa-motorcycle"></i></div>
          <div class="sidebar-brand">
            <span class="sidebar-brand-name">HERCO</span>
            <span class="sidebar-brand-sub">Admin Panel</span>
          </div>
        </div>
        <nav class="sidebar-nav">${navHTML}</nav>
        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar" id="userAvatar">A</div>
            <div class="user-details">
              <span class="user-name" id="userName">Admin</span>
              <span class="user-role" id="userRole">Administrator</span>
            </div>
            <button class="logout-btn" id="logoutBtn" title="Logout">
              <i class="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </aside>
    `;
  }

  function buildTopbar(breadcrumb) {
    return `
      <header class="topbar">
        <div class="topbar-left">
          <button class="menu-toggle" id="menuToggle"><i class="fas fa-bars"></i></button>
          <div class="breadcrumb">${breadcrumb}</div>
        </div>
        <div class="topbar-right">
          <div class="topbar-date" id="topbarDate"></div>

          <!-- Notification Button -->
          <div class="notif-wrap" id="notifWrap">
            <button class="topbar-btn" id="notifBtn" title="Notifications">
              <i class="fas fa-bell"></i>
              <span class="notif-dot hidden" id="notifDot"></span>
            </button>

            <!-- Dropdown Panel -->
            <div class="notif-panel hidden" id="notifPanel">
              <div class="notif-panel-header">
                <span class="notif-panel-title"><i class="fas fa-bell"></i> Notifications</span>
                <button class="notif-refresh-btn" id="notifRefresh" title="Refresh">
                  <i class="fas fa-sync-alt"></i>
                </button>
              </div>
              <div class="notif-list" id="notifList">
                <div class="notif-loading">
                  <i class="fas fa-spinner fa-spin"></i> Loading...
                </div>
              </div>
              <div class="notif-panel-footer">
                <a href="/admin/bookings" class="notif-view-all">View all bookings <i class="fas fa-arrow-right"></i></a>
              </div>
            </div>
          </div>

        </div>
      </header>

      <!-- Notification Styles (scoped here so they load with layout) -->
      <style>
        .notif-wrap {
          position: relative;
        }

        #notifBtn {
          position: relative;
        }

        .notif-dot {
          position: absolute;
          top: 7px; right: 7px;
          width: 8px; height: 8px;
          background: var(--red);
          border-radius: 50%;
          border: 2px solid var(--dark-2);
          animation: pulseDot 2s infinite;
        }

        .notif-dot.hidden { display: none; }

        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(1.3); }
        }

        .notif-panel {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 340px;
          background: var(--dark-2);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: var(--radius);
          box-shadow: 0 16px 48px rgba(0,0,0,0.5);
          z-index: 300;
          animation: notifSlideIn 0.2s ease;
          overflow: hidden;
        }

        .notif-panel.hidden { display: none; }

        @keyframes notifSlideIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .notif-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border-bottom: 1px solid var(--border);
        }

        .notif-panel-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .notif-panel-title i { color: var(--red); }

        .notif-refresh-btn {
          background: none;
          border: none;
          color: var(--text-dim);
          cursor: pointer;
          font-size: 12px;
          padding: 4px 6px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .notif-refresh-btn:hover {
          color: var(--text);
          background: var(--dark-3);
        }

        .notif-refresh-btn.spinning i {
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .notif-list {
          max-height: 320px;
          overflow-y: auto;
        }

        .notif-list::-webkit-scrollbar { width: 4px; }
        .notif-list::-webkit-scrollbar-thumb { background: var(--dark-4); border-radius: 4px; }

        .notif-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 28px 16px;
          font-size: 13px;
          color: var(--text-dim);
        }

        .notif-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 28px 16px;
          gap: 8px;
          color: var(--text-dim);
          font-size: 13px;
          text-align: center;
        }

        .notif-empty i { font-size: 24px; opacity: 0.3; }

        .notif-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          transition: background 0.15s;
          cursor: default;
        }

        .notif-item:last-child { border-bottom: none; }
        .notif-item:hover { background: var(--dark-3); }

        .notif-icon {
          width: 34px;
          height: 34px;
          min-width: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          margin-top: 1px;
        }

        .notif-icon.pending     { background: rgba(245,158,11,0.12); color: #f59e0b; }
        .notif-icon.pickup      { background: rgba(59,130,246,0.12); color: #3b82f6; }
        .notif-icon.new-booking { background: rgba(16,185,129,0.12); color: #10b981; }
        .notif-icon.expired     { background: rgba(239,68,68,0.12);  color: #ef4444; }

        .notif-content { flex: 1; min-width: 0; }

        .notif-content strong {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .notif-content p {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 2px;
          line-height: 1.4;
        }

        .notif-content .notif-ref {
          font-size: 10px;
          color: var(--text-dim);
          margin-top: 3px;
          font-family: monospace;
        }

        .notif-section-label {
          padding: 8px 16px 4px;
          font-size: 10px;
          font-weight: 600;
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 1px;
          background: var(--dark-3);
          border-bottom: 1px solid var(--border);
        }

        .notif-panel-footer {
          padding: 10px 16px;
          border-top: 1px solid var(--border);
          background: var(--dark-3);
        }

        .notif-view-all {
          font-size: 12px;
          color: var(--red);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
          transition: opacity 0.2s;
        }

        .notif-view-all:hover { opacity: 0.75; }

        .notif-count-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--red);
          color: white;
          font-size: 10px;
          font-weight: 700;
          min-width: 18px;
          height: 18px;
          border-radius: 10px;
          padding: 0 5px;
          margin-left: 6px;
        }
      </style>
    `;
  }

  function initDateTime() {
    function update() {
      const now = new Date();
      const dateEl = document.getElementById('topbarDate');
      if (dateEl) dateEl.textContent = now.toLocaleDateString('en-PH', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    }
    update();
    setInterval(update, 60000);
  }

  async function initUserInfo() {
    try {
      const res  = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) {
        const u = data.user;
        const el = (id) => document.getElementById(id);
        if (el('userName'))   el('userName').textContent   = u.name || 'Admin';
        if (el('userRole'))   el('userRole').textContent   = u.role || 'Administrator';
        if (el('userAvatar')) el('userAvatar').textContent = (u.name || 'A')[0].toUpperCase();
        if (el('greetingName')) el('greetingName').textContent = (u.name || 'Admin').split(' ')[0];
      }
    } catch (err) {
      console.warn('Could not load user info:', err.message);
    }
  }

  function initLogout() {
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
      try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (_) {}
      window.location.href = '/auth/login';
    });
  }

  function initMobileMenu() {
    const sidebar    = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    menuToggle?.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
          sidebar.classList.remove('open');
        }
      }
    });
  }

  async function initPendingBadge() {
    try {
      const res  = await fetch('/api/admin/stats/today');
      const data = await res.json();
      const badge = document.getElementById('pendingBadge');
      if (badge && data.success) badge.textContent = data.data.pending || 0;
    } catch (_) {}
  }

  // ── NOTIFICATIONS ────────────────────────────────────────
  function initNotifications() {
    const btn      = document.getElementById('notifBtn');
    const panel    = document.getElementById('notifPanel');
    const dot      = document.getElementById('notifDot');
    const refresh  = document.getElementById('notifRefresh');
    const notifWrap = document.getElementById('notifWrap');

    if (!btn || !panel) return;

    // Toggle panel
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = panel.classList.contains('hidden');
      if (isHidden) {
        panel.classList.remove('hidden');
        loadNotifications();
      } else {
        panel.classList.add('hidden');
      }
    });

    // Refresh button
    refresh?.addEventListener('click', (e) => {
      e.stopPropagation();
      refresh.classList.add('spinning');
      loadNotifications().finally(() => {
        setTimeout(() => refresh.classList.remove('spinning'), 400);
      });
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!notifWrap.contains(e.target)) {
        panel.classList.add('hidden');
      }
    });

    // Auto-load count on init (for the dot indicator)
    loadNotificationCount();

    // Refresh count every 60 seconds
    setInterval(loadNotificationCount, 60000);
  }

  async function loadNotificationCount() {
    try {
      const res  = await fetch('/api/admin/notifications/count');
      const data = await res.json();
      const dot  = document.getElementById('notifDot');
      if (dot && data.success) {
        if (data.count > 0) {
          dot.classList.remove('hidden');
        } else {
          dot.classList.add('hidden');
        }
      }
    } catch (_) {}
  }

  async function loadNotifications() {
    const list = document.getElementById('notifList');
    if (!list) return;

    list.innerHTML = `<div class="notif-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>`;

    try {
      const res  = await fetch('/api/admin/notifications/list');
      const data = await res.json();

      if (!data.success) {
        list.innerHTML = `<div class="notif-empty"><i class="fas fa-exclamation-triangle"></i><p>Failed to load notifications</p></div>`;
        return;
      }

      const { pending, pickup, newBookings, expired } = data.data;
      const total = (pending?.length || 0) + (pickup?.length || 0) + (newBookings?.length || 0) + (expired?.length || 0);

      // Update dot
      const dot = document.getElementById('notifDot');
      if (dot) {
        if (total > 0) dot.classList.remove('hidden');
        else           dot.classList.add('hidden');
      }

      if (total === 0) {
        list.innerHTML = `<div class="notif-empty"><i class="fas fa-check-circle"></i><p>All caught up!<br>No pending actions.</p></div>`;
        return;
      }

      let html = '';

      // New bookings today
      if (newBookings?.length) {
        html += `<div class="notif-section-label"><i class="fas fa-calendar-plus" style="margin-right:5px;color:#10b981"></i> New Today <span class="notif-count-badge">${newBookings.length}</span></div>`;
        html += newBookings.map(b => `
          <div class="notif-item">
            <div class="notif-icon new-booking"><i class="fas fa-calendar-check"></i></div>
            <div class="notif-content">
              <strong>${b.guest_name || 'Guest'}</strong>
              <p>${b.service_name || '—'} ${b.variant_name ? `(${b.variant_name})` : ''}</p>
              <span class="notif-ref">${b.reference_code || ''}</span>
            </div>
          </div>`).join('');
      }

      // Pending bookings (not yet started)
      if (pending?.length) {
        html += `<div class="notif-section-label"><i class="fas fa-clock" style="margin-right:5px;color:#f59e0b"></i> Pending Action <span class="notif-count-badge" style="background:#f59e0b">${pending.length}</span></div>`;
        html += pending.map(b => `
          <div class="notif-item">
            <div class="notif-icon pending"><i class="fas fa-clock"></i></div>
            <div class="notif-content">
              <strong>${b.guest_name || 'Guest'}</strong>
              <p>Waiting to be marked In Progress</p>
              <span class="notif-ref">${b.reference_code || ''}</span>
            </div>
          </div>`).join('');
      }

      // Done — waiting for pickup
      if (pickup?.length) {
        html += `<div class="notif-section-label"><i class="fas fa-motorcycle" style="margin-right:5px;color:#3b82f6"></i> Ready for Pickup <span class="notif-count-badge" style="background:#3b82f6">${pickup.length}</span></div>`;
        html += pickup.map(b => `
          <div class="notif-item">
            <div class="notif-icon pickup"><i class="fas fa-motorcycle"></i></div>
            <div class="notif-content">
              <strong>${b.guest_name || 'Guest'}</strong>
              <p>${b.service_name || '—'} — Done, awaiting pickup</p>
              <span class="notif-ref">${b.reference_code || ''}</span>
            </div>
          </div>`).join('');
      }

      // Expired bookings today
      if (expired?.length) {
        html += `<div class="notif-section-label"><i class="fas fa-times-circle" style="margin-right:5px;color:#ef4444"></i> Expired Today <span class="notif-count-badge">${expired.length}</span></div>`;
        html += expired.map(b => `
          <div class="notif-item">
            <div class="notif-icon expired"><i class="fas fa-times-circle"></i></div>
            <div class="notif-content">
              <strong>${b.guest_name || 'Guest'}</strong>
              <p>Booking expired without payment</p>
              <span class="notif-ref">${b.reference_code || ''}</span>
            </div>
          </div>`).join('');
      }

      list.innerHTML = html;

    } catch (err) {
      console.error('Load notifications error:', err);
      list.innerHTML = `<div class="notif-empty"><i class="fas fa-exclamation-triangle"></i><p>Failed to load</p></div>`;
    }
  }

  function init({ activePage, breadcrumb }) {
    const app = document.getElementById('app');
    const wrapper = document.createElement('div');
    wrapper.className = 'layout-wrapper';
    wrapper.innerHTML = buildSidebar(activePage) + `
      <div class="main-wrap">
        ${buildTopbar(breadcrumb)}
        <main class="content" id="mainContent"></main>
      </div>
    `;

    document.body.insertBefore(wrapper, app);
    document.getElementById('mainContent').appendChild(app);

    initDateTime();
    initUserInfo();
    initLogout();
    initMobileMenu();
    initPendingBadge();
    initNotifications();
  }

  // Shared helpers
  function statusBadge(status) {
    const icons = {
      pending:     'fas fa-clock',
      in_progress: 'fas fa-tools',
      done:        'fas fa-check-circle',
      picked_up:   'fas fa-motorcycle',
      confirmed:   'fas fa-check',
      expired:     'fas fa-times-circle',
      locked:      'fas fa-lock',
      paid:        'fas fa-check-circle',
      unpaid:      'fas fa-times-circle',
      failed:      'fas fa-ban',
      admin:       'fas fa-user-shield',
      staff:       'fas fa-user-cog',
    };
    const icon = icons[status] || 'fas fa-circle';
    return `<span class="status-badge status-${status}"><i class="${icon}"></i>${status.replace('_', ' ')}</span>`;
  }

  function formatCurrency(amount) {
    return '₱' + Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 });
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
      + ' ' + d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
  }

  return { init, statusBadge, formatCurrency, formatDate, formatDateTime };
})();