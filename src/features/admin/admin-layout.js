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
          <button class="topbar-btn" title="Notifications">
            <i class="fas fa-bell"></i>
            <span class="notif-dot"></span>
          </button>
        </div>
      </header>
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
        // Greeting on dashboard
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

  function init({ activePage, breadcrumb }) {
    // Inject sidebar + topbar before #app
    const app = document.getElementById('app');
    const wrapper = document.createElement('div');
    wrapper.className = 'layout-wrapper';
    wrapper.innerHTML = buildSidebar(activePage) + `
      <div class="main-wrap">
        ${buildTopbar(breadcrumb)}
        <main class="content" id="mainContent"></main>
      </div>
    `;

    // Move #app content into mainContent after DOM is ready
    document.body.insertBefore(wrapper, app);
    document.getElementById('mainContent').appendChild(app);

    initDateTime();
    initUserInfo();
    initLogout();
    initMobileMenu();
    initPendingBadge();
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