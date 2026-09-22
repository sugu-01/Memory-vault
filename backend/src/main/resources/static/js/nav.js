/* ============================================================
   Memory Vault — Minimal Navigation Module (nav.js)
   Top navigation bar + Slide-in drawer with only 4 items.
   ============================================================ */

const MAIN_NAV_LINKS = [
  { href: '/dashboard.html', icon: '🏠', label: 'Home' },
  { href: '/diary.html',     icon: '📖', label: 'My Memory' },
  { href: '/goals.html',     icon: '🎯', label: 'Goals to Be Done' },
  { href: '/settings.html',  icon: '⚙️', label: 'Settings' }
];

function initNav(activePageTitle) {
  const displayName = localStorage.getItem('displayName') || localStorage.getItem('username') || 'Profile';
  const currentPath = window.location.pathname;

  const navLinksHTML = MAIN_NAV_LINKS.map(link => {
    const isActive = currentPath === link.href || currentPath.endsWith(link.href.replace('/', ''));
    return `
      <a href="${link.href}" class="drawer-link${isActive ? ' active' : ''}">
        <span style="font-size:1.15rem;">${link.icon}</span>
        <span>${link.label}</span>
      </a>
    `;
  }).join('');

  const topbarHTML = `
    <header class="topbar">
      <div class="topbar-left">
        <button class="topbar-hamburger" id="nav-drawer-toggle" aria-label="Open navigation menu">
          ☰
        </button>
        <a href="/dashboard.html" class="topbar-brand">
          <span>🧠</span>
          <span>Memory Vault</span>
        </a>
      </div>
      <div class="topbar-right">
        <a href="/settings.html" class="topbar-profile-btn" title="Settings & Profile">
          <span>👤</span>
          <span id="nav-profile-name">${escapeHtml(displayName)}</span>
        </a>
      </div>
    </header>
  `;

  const drawerHTML = `
    <div class="drawer-overlay" id="drawer-overlay"></div>
    <aside class="drawer" id="nav-drawer">
      <div class="drawer-header">
        <div class="drawer-title">
          <span>🧠</span>
          <span>Memory Vault</span>
        </div>
        <button class="drawer-close" id="nav-drawer-close" aria-label="Close navigation">✕</button>
      </div>

      <nav class="drawer-nav">
        ${navLinksHTML}
      </nav>

      <div class="drawer-footer">
        <button class="btn btn-secondary btn-full btn-sm" id="nav-logout-btn">
          <span>🚪</span>
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  `;

  // Insert header and drawer at start of body
  document.body.insertAdjacentHTML('afterbegin', topbarHTML + drawerHTML);

  // Drawer toggle logic
  const drawer = document.getElementById('nav-drawer');
  const overlay = document.getElementById('drawer-overlay');
  const toggleBtn = document.getElementById('nav-drawer-toggle');
  const closeBtn = document.getElementById('nav-drawer-close');

  function openDrawer() {
    drawer?.classList.add('open');
    overlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer?.classList.remove('open');
    overlay?.classList.remove('active');
    document.body.style.overflow = '';
  }

  toggleBtn?.addEventListener('click', openDrawer);
  closeBtn?.addEventListener('click', closeDrawer);
  overlay?.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });

  // Logout
  document.getElementById('nav-logout-btn')?.addEventListener('click', async () => {
    const confirmed = await showConfirmDialog('Log Out', 'Are you sure you want to log out?');
    if (!confirmed) return;
    try {
      await api.post('/auth/logout', {});
    } catch { /* ignore */ }
    clearTokens();
    window.location.href = '/index.html';
  });

  // Helper to update display name dynamically
  window.updateNavDisplayName = (name) => {
    const el = document.getElementById('nav-profile-name');
    if (el) el.textContent = name;
  };
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

window.initNav = initNav;
