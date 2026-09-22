/* ============================================================
   Memory Vault — Dashboard JS (dashboard.js)
   ============================================================ */

if (!requireAuth()) throw new Error('Not authenticated');

initNav('Dashboard');

/* ── Greeting ──────────────────────────────────────────── */
function setGreeting() {
  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const displayName = localStorage.getItem('displayName') || '';
  const el = document.getElementById('welcome-msg');
  if (el) el.textContent = `${greeting}, ${displayName} 👋`;
}
setGreeting();

/* ── Helpers ───────────────────────────────────────────── */
function fmtDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function moodEmoji(mood) {
  const map = { HAPPY: '😊', NEUTRAL: '😐', SAD: '😢', ANGRY: '😡', EXCITED: '🤩' };
  return map[mood] || '😐';
}

/* ── Stats ─────────────────────────────────────────────── */
async function loadStats() {
  try {
    const [memories, tasks, reminders, goals] = await Promise.allSettled([
      api.get('/memories?page=0&size=1'),
      api.get('/tasks?page=0&size=1'),
      api.get('/reminders?page=0&size=1'),
      api.get('/goals?page=0&size=1'),
    ]);

    const mCount = memories.value?.data?.totalElements ?? memories.value?.totalElements ?? 0;
    const tCount = tasks.value?.data?.totalElements    ?? tasks.value?.totalElements    ?? 0;
    const rCount = reminders.value?.data?.totalElements?? reminders.value?.totalElements?? 0;
    const gCount = goals.value?.data?.totalElements    ?? goals.value?.totalElements    ?? 0;

    document.getElementById('stats-grid').innerHTML = `
      <div class="stat-card">
        <div class="stat-icon stat-icon-accent">📖</div>
        <div class="stat-value">${mCount}</div>
        <div class="stat-label">Memories</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-success">✅</div>
        <div class="stat-value">${tCount}</div>
        <div class="stat-label">Tasks</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-warning">🔔</div>
        <div class="stat-value">${rCount}</div>
        <div class="stat-label">Reminders</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-secondary">🎯</div>
        <div class="stat-value">${gCount}</div>
        <div class="stat-label">Goals</div>
      </div>`;
  } catch (err) {
    document.getElementById('stats-grid').innerHTML =
      `<div class="card" style="grid-column:1/-1"><p class="text-muted text-sm">Could not load stats. <button class="btn btn-ghost btn-sm" onclick="loadStats()">Retry</button></p></div>`;
  }
}

/* ── Recent Memories ───────────────────────────────────── */
async function loadRecentMemories() {
  try {
    const res = await api.get('/memories?page=0&size=5&sort=createdAt,desc');
    const items = res?.data?.content ?? res?.content ?? res?.data ?? [];
    const el = document.getElementById('recent-memories');
    if (!items.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">📖</div><div class="empty-title">No memories yet</div><div class="empty-desc">Start writing your first memory entry!</div><a href="/diary.html" class="btn btn-primary btn-sm">Write Now</a></div>`;
      return;
    }
    el.innerHTML = items.map(m => `
      <div class="memory-card card-glow" onclick="window.location='/diary.html'" style="margin-bottom:0.75rem">
        <div class="memory-card-header">
          <span class="memory-card-title">${escHtml(m.title || 'Untitled')}</span>
          <span class="mood-badge">${moodEmoji(m.mood)}</span>
        </div>
        <div class="memory-card-content">${escHtml(m.content || '')}</div>
        <div class="memory-card-footer">
          <span class="text-xs text-muted">${fmtDate(m.date || m.createdAt)}</span>
          ${m.important ? '<span class="star-icon starred">⭐</span>' : ''}
          <div style="display:flex;gap:0.25rem;flex-wrap:wrap">
            ${(m.tags || []).map(t => `<span class="tag">${escHtml(t)}</span>`).join('')}
          </div>
        </div>
      </div>`).join('');
  } catch {
    document.getElementById('recent-memories').innerHTML =
      `<div class="card"><p class="text-muted text-sm">Could not load memories. <button class="btn btn-ghost btn-sm" onclick="loadRecentMemories()">Retry</button></p></div>`;
  }
}

/* ── Upcoming Reminders ────────────────────────────────── */
async function loadUpcomingReminders() {
  try {
    const res = await api.get('/reminders?page=0&size=3&sort=reminderTime,asc');
    const items = res?.data?.content ?? res?.content ?? res?.data ?? [];
    const el = document.getElementById('upcoming-reminders');
    if (!items.length) {
      el.innerHTML = `<div class="empty-state" style="padding:1rem"><div class="empty-icon" style="font-size:1.5rem">🔔</div><div class="empty-title">No upcoming reminders</div></div>`;
      return;
    }
    el.innerHTML = items.map(r => `
      <div class="reminder-card" style="margin-bottom:0.625rem" onclick="window.location='/reminders.html'">
        <div class="reminder-icon">🔔</div>
        <div class="reminder-body">
          <div class="reminder-title">${escHtml(r.title || 'Reminder')}</div>
          <div class="reminder-time">${r.reminderTime ? fmtDateTime(r.reminderTime) : ''}</div>
        </div>
      </div>`).join('');
  } catch {
    document.getElementById('upcoming-reminders').innerHTML =
      `<div class="card"><p class="text-muted text-sm">Could not load reminders. <button class="btn btn-ghost btn-sm" onclick="loadUpcomingReminders()">Retry</button></p></div>`;
  }
}

/* ── Pending Tasks ─────────────────────────────────────── */
async function loadPendingTasks() {
  try {
    const res = await api.get('/tasks?status=PENDING&page=0&size=3');
    const items = res?.data?.content ?? res?.content ?? res?.data ?? [];
    const el = document.getElementById('pending-tasks');
    if (!items.length) {
      el.innerHTML = `<div class="empty-state" style="padding:1rem"><div class="empty-icon" style="font-size:1.5rem">✅</div><div class="empty-title">No pending tasks</div></div>`;
      return;
    }
    el.innerHTML = items.map(t => {
      const isOverdue = t.dueDate && new Date(t.dueDate) < new Date();
      return `
        <div class="list-task-item" onclick="window.location='/tasks.html'" style="margin-bottom:0.5rem;${isOverdue ? 'border-left:3px solid var(--danger)' : ''}">
          <span style="font-size:0.875rem">📋</span>
          <span style="flex:1;font-size:0.875rem;font-weight:500">${escHtml(t.title)}</span>
          ${t.dueDate ? `<span class="badge ${isOverdue ? 'badge-danger' : 'badge-muted'}">${fmtDate(t.dueDate)}</span>` : ''}
        </div>`;
    }).join('');
  } catch {
    document.getElementById('pending-tasks').innerHTML =
      `<div class="card"><p class="text-muted text-sm">Could not load tasks. <button class="btn btn-ghost btn-sm" onclick="loadPendingTasks()">Retry</button></p></div>`;
  }
}

/* ── Goal Progress ─────────────────────────────────────── */
async function loadGoalProgress() {
  try {
    const res = await api.get('/goals?page=0&size=3');
    const items = res?.data?.content ?? res?.content ?? res?.data ?? [];
    const el = document.getElementById('goal-progress');
    if (!items.length) {
      el.innerHTML = `<div class="empty-state" style="padding:1rem"><div class="empty-icon" style="font-size:1.5rem">🎯</div><div class="empty-title">No goals yet</div></div>`;
      return;
    }
    el.innerHTML = items.map(g => {
      const pct = Math.min(100, Math.round((g.progress || 0) * 100));
      return `
        <div class="card" style="margin-bottom:0.75rem;cursor:pointer" onclick="window.location='/goals.html'">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
            <span style="font-size:0.875rem;font-weight:600">${escHtml(g.title)}</span>
            <span class="text-xs text-accent">${pct}%</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>`;
    }).join('');
  } catch {
    document.getElementById('goal-progress').innerHTML =
      `<div class="card"><p class="text-muted text-sm">Could not load goals. <button class="btn btn-ghost btn-sm" onclick="loadGoalProgress()">Retry</button></p></div>`;
  }
}

/* ── Utilities ─────────────────────────────────────────── */
function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtDateTime(str) {
  if (!str) return '';
  return new Date(str).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ── Init ──────────────────────────────────────────────── */
loadStats();
loadRecentMemories();
loadUpcomingReminders();
loadPendingTasks();
loadGoalProgress();
