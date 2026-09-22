/* ============================================================
   Memory Vault — Navigation Module (nav.js)
   Renders sidebar, sets active state, handles mobile menu.
   ============================================================ */

const NAV_LINKS = [
  { href: '/dashboard.html',  icon: '🏠', label: 'Dashboard' },
  { href: '/diary.html',      icon: '📖', label: 'Diary' },
  { href: '/tasks.html',      icon: '✅', label: 'Tasks' },
  { href: '/reminders.html',  icon: '🔔', label: 'Reminders' },
  { href: '/goals.html',      icon: '🎯', label: 'Goals' },
  { href: '/evaluate.html',   icon: '📊', label: 'Evaluate' },
  { href: '/assistant.html',  icon: '🤖', label: 'AI Assistant' },
  { href: '/search.html',     icon: '🔍', label: 'Search' },
  { href: '/settings.html',   icon: '⚙️', label: 'Settings' },
];

function initNav(pageTitle) {
  const displayName = localStorage.getItem('displayName') || localStorage.getItem('username') || 'User';
  const currentPath = window.location.pathname;

  const navLinksHTML = NAV_LINKS.map(link => {
    const isActive = currentPath === link.href || currentPath.endsWith(link.href.replace('/', ''));
    return `<a href="${link.href}" class="nav-link${isActive ? ' active' : ''}">
      <span class="nav-icon">${link.icon}</span>
      <span>${link.label}</span>
    </a>`;
  }).join('');

  const sidebarHTML = `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-logo">
        <div class="sidebar-logo-icon">🧠</div>
        <span class="sidebar-logo-text">Memory Vault</span>
      </div>
      <div class="sidebar-user">
        <div class="sidebar-user-name" id="sidebar-display-name">${displayName}</div>
        <div class="sidebar-user-label">Signed in</div>
      </div>
      <nav class="sidebar-nav">
        ${navLinksHTML}
      </nav>
      <div class="sidebar-footer">
        <button class="sidebar-logout" id="logout-btn">
          <span>🚪</span>
          <span>Log Out</span>
        </button>
      </div>
    </aside>
    <div class="sidebar-overlay" id="sidebar-overlay"></div>
  `;

  const topbarHTML = `
    <header class="topbar">
      <button class="topbar-hamburger" id="sidebar-toggle" aria-label="Toggle menu">
        ☰
      </button>
      <span class="topbar-title">${pageTitle || ''}</span>
      <div class="topbar-actions">
        <a href="/search.html" class="btn btn-ghost btn-icon" title="Search">🔍</a>
      </div>
    </header>
  `;

  // Insert sidebar before the main content
  const appLayout = document.querySelector('.app-layout');
  if (appLayout) {
    appLayout.insertAdjacentHTML('afterbegin', sidebarHTML);
  }

  // Insert topbar at top of main-content
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.insertAdjacentHTML('afterbegin', topbarHTML);
  }

  // Wire up logout
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    const confirmed = await showConfirmDialog('Log Out', 'Are you sure you want to log out?');
    if (!confirmed) return;
    try {
      await api.post('/auth/logout', {});
    } catch { /* ignore */ }
    clearTokens();
    window.location.href = '/index.html';
  });

  // Mobile sidebar toggle
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const toggleBtn = document.getElementById('sidebar-toggle');

  function openSidebar() {
    sidebar?.classList.add('open');
    overlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar?.classList.remove('open');
    overlay?.classList.remove('active');
    document.body.style.overflow = '';
  }

  toggleBtn?.addEventListener('click', () => {
    sidebar?.classList.contains('open') ? closeSidebar() : openSidebar();
  });

  overlay?.addEventListener('click', closeSidebar);

  // Close on ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeSidebar();
  });

  // Update display name if changed
  window.updateNavDisplayName = (name) => {
    const el = document.getElementById('sidebar-display-name');
    if (el) el.textContent = name;
    localStorage.setItem('displayName', name);
  };
}

window.initNav = initNav;
