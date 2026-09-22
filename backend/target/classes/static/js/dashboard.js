/* ============================================================
   Memory Vault — Calm Home Script (dashboard.js)
   Two main sections, smart daily input, and automated summary.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  initNav('Home');

  const greetingEl = document.getElementById('home-greeting');
  const metricMemories = document.getElementById('metric-memories');
  const metricGoals = document.getElementById('metric-goals');
  const summaryContent = document.getElementById('summary-content');
  const summaryDateLabel = document.getElementById('summary-date-label');
  const motivationBadge = document.getElementById('summary-motivation-badge');

  const smartForm = document.getElementById('smart-input-form');
  const smartText = document.getElementById('smart-input-text');
  const smartBtn = document.getElementById('smart-save-btn');

  // Set greeting
  function setGreeting() {
    const h = new Date().getHours();
    const timeOfDay = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    const name = localStorage.getItem('displayName') || localStorage.getItem('username') || '';
    if (greetingEl) {
      greetingEl.textContent = `${timeOfDay}, ${name} 👋`;
    }
  }
  setGreeting();

  // Load Daily Summary & metrics
  async function loadSummary() {
    try {
      const res = await api.get('/daily-summary');
      const data = res?.data;
      if (!data) return;

      // Update Hub Card Metrics
      const memCount = data.memoryCountToday || 0;
      metricMemories.textContent = `${memCount} recorded today`;

      const pendingCount = data.totalPendingTasks || 0;
      const compCount = data.totalCompletedTasks || 0;
      metricGoals.textContent = `${pendingCount} pending • ${compCount} completed`;

      // Update Date Label & Motivation
      const todayFormatted = new Date().toLocaleDateString(undefined, {
        weekday: 'long', month: 'short', day: 'numeric'
      });
      summaryDateLabel.textContent = todayFormatted;

      if (data.motivationText) {
        motivationBadge.textContent = data.motivationText;
      }

      // Render Summary Content
      renderSummaryDetails(data);
    } catch (e) {
      summaryContent.innerHTML = `<p class="text-danger text-sm">Could not load today's summary: ${e.message}</p>`;
    }
  }

  function renderSummaryDetails(data) {
    const memCount = data.memoryCountToday || 0;
    const completedTasks = data.completedTasksToday || [];
    const pendingTasks = data.pendingTasks || [];
    const reminders = data.upcomingReminders || [];

    let html = '';

    // Memories row
    html += `
      <div style="margin-bottom: 1.25rem; font-size: 0.95rem;">
        ${memCount > 0
          ? `You have recorded <strong>${memCount} memor${memCount === 1 ? 'y' : 'ies'}</strong> today.`
          : `No memories recorded yet today.`}
        <a href="/diary.html" class="btn btn-ghost btn-xs" style="margin-left:0.5rem;">View diary →</a>
      </div>
    `;

    // Completed today
    if (completedTasks.length > 0) {
      html += `<div class="summary-section-title">Completed Today</div>`;
      completedTasks.forEach(t => {
        html += `
          <div class="summary-item">
            <div class="summary-item-left">
              <span style="color:var(--success); font-weight:700;">✓</span>
              <span style="text-decoration:line-through; color:var(--text-secondary);">${escapeHtml(t.title)}</span>
            </div>
            <span class="badge badge-success">Done</span>
          </div>
        `;
      });
    }

    // Still pending
    if (pendingTasks.length > 0) {
      html += `<div class="summary-section-title">Still Pending (${pendingTasks.length})</div>`;
      // Show top 4 pending tasks
      pendingTasks.slice(0, 4).forEach(t => {
        const dueDate = t.dueDate ? `Due ${new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : '';
        html += `
          <div class="summary-item" id="task-item-${t.id}">
            <div class="summary-item-left">
              <span style="color:var(--text-muted);">○</span>
              <span style="font-weight:500;">${escapeHtml(t.title)}</span>
              ${dueDate ? `<span class="text-xs text-muted" style="margin-left:0.25rem;">(${dueDate})</span>` : ''}
            </div>
            <div class="quick-action-btn-group">
              <button class="btn btn-secondary btn-sm quick-done-btn" data-id="${t.id}" title="Mark as Done">✓ Done</button>
              <button class="btn btn-secondary btn-sm quick-tomorrow-btn" data-id="${t.id}" title="Move to Tomorrow">Tomorrow</button>
            </div>
          </div>
        `;
      });

      if (pendingTasks.length > 4) {
        html += `
          <div style="text-align:right; margin-top:0.4rem;">
            <a href="/goals.html" class="text-xs text-secondary">View all ${pendingTasks.length} pending tasks →</a>
          </div>
        `;
      }
    } else if (completedTasks.length === 0) {
      html += `
        <div class="summary-item" style="background:transparent; padding:0.5rem 0;">
          <span class="text-secondary text-sm">No tasks pending for today. Take your time.</span>
        </div>
      `;
    }

    // Remember tomorrow / upcoming
    if (reminders.length > 0) {
      html += `<div class="summary-section-title">Remember Tomorrow</div>`;
      reminders.forEach(r => {
        const timeStr = r.remindAt ? new Date(r.remindAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        html += `
          <div class="summary-item">
            <div class="summary-item-left">
              <span style="color:var(--warning);">•</span>
              <span>${escapeHtml(r.title)}</span>
            </div>
            <span class="text-xs text-muted">${timeStr}</span>
          </div>
        `;
      });
    }

    summaryContent.innerHTML = html;

    // Attach quick action listeners
    summaryContent.querySelectorAll('.quick-done-btn').forEach(btn => {
      btn.addEventListener('click', () => handleQuickAction(btn.dataset.id, 'DONE'));
    });

    summaryContent.querySelectorAll('.quick-tomorrow-btn').forEach(btn => {
      btn.addEventListener('click', () => handleQuickAction(btn.dataset.id, 'TOMORROW'));
    });
  }

  // 1-Click Task Quick Action
  async function handleQuickAction(taskId, action) {
    try {
      await api.post(`/tasks/${taskId}/quick-action`, { action });
      showSuccess(action === 'DONE' ? 'Task marked as done! 🎉' : 'Task moved to tomorrow.');
      loadSummary();
    } catch (e) {
      showError('Action failed: ' + e.message);
    }
  }

  // Smart Daily Input Submit
  smartForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = smartText.value.trim();
    if (!text) return;

    setButtonLoading(smartBtn, true, 'Saving & Organizing...');

    try {
      const res = await api.post('/smart-input', { text });
      const msg = res?.data?.summaryMessage || 'Saved and automatically organized!';
      showSuccess(msg);
      smartText.value = '';
      loadSummary();
    } catch (err) {
      // DATA SAFETY: preserve text in the textarea if saving fails
      showError("Couldn't save your entry. Please try again. Your writing is kept safe.");
    } finally {
      setButtonLoading(smartBtn, false, 'Save & Organize');
    }
  });

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  loadSummary();
});
