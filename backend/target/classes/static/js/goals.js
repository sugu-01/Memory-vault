/* ============================================================
   Memory Vault — Goals to Be Done Script (goals.js)
   Unified goals, tasks, focus, reminders, and evaluations.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  initNav('Goals to Be Done');

  let currentTab = 'tasks';
  let allTasks = [];
  let allGoals = [];
  let allReminders = [];
  let allEvaluations = [];

  // Tab buttons
  const tabs = document.querySelectorAll('.tab-btn');
  const secTasks = document.getElementById('tab-content-tasks');
  const secGoals = document.getElementById('tab-content-goals');
  const secReminders = document.getElementById('tab-content-reminders');
  const secEvals = document.getElementById('tab-content-evaluations');
  const secSearch = document.getElementById('tab-content-search');

  // Tasks elements
  const quickTaskForm = document.getElementById('quick-task-form');
  const quickTaskTitle = document.getElementById('quick-task-title');
  const quickTaskDate = document.getElementById('quick-task-date');
  const quickTaskPriority = document.getElementById('quick-task-priority');
  const pendingTasksList = document.getElementById('pending-tasks-list');
  const completedTasksList = document.getElementById('completed-tasks-list');
  const countPending = document.getElementById('count-pending');
  const countCompleted = document.getElementById('count-completed');

  // Goals elements
  const goalsList = document.getElementById('goals-list');

  // Reminders elements
  const remindersList = document.getElementById('reminders-list');

  // Evaluations elements
  const evaluationsList = document.getElementById('evaluations-list');

  // Search elements
  const goalsSearchInput = document.getElementById('goals-search-input');
  const goalsSearchResults = document.getElementById('goals-search-results');

  // Modals
  const taskModal = document.getElementById('task-modal');
  const goalModal = document.getElementById('goal-modal');
  const reminderModal = document.getElementById('reminder-modal');
  const evalModal = document.getElementById('eval-modal');

  // Switch tabs
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.tab;

      secTasks.classList.toggle('hidden', currentTab !== 'tasks');
      secGoals.classList.toggle('hidden', currentTab !== 'goals');
      secReminders.classList.toggle('hidden', currentTab !== 'reminders');
      secEvals.classList.toggle('hidden', currentTab !== 'evaluations');
      secSearch.classList.toggle('hidden', currentTab !== 'search');

      if (currentTab === 'tasks') loadTasks();
      if (currentTab === 'goals') loadGoals();
      if (currentTab === 'reminders') loadReminders();
      if (currentTab === 'evaluations') loadEvaluations();
      if (currentTab === 'search') goalsSearchInput.focus();
    });
  });

  /* ── 1. TASKS LOGIC ────────────────────────────────────── */
  async function loadTasks() {
    try {
      const res = await api.get('/tasks');
      allTasks = res?.data || [];
      renderTasks();
    } catch (e) {
      pendingTasksList.innerHTML = `<p class="text-danger text-sm">Failed to load tasks: ${escapeHtml(e.message)}</p>`;
    }
  }

  function renderTasks() {
    const pending = allTasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
    const completed = allTasks.filter(t => t.status === 'COMPLETED');

    countPending.textContent = pending.length;
    countCompleted.textContent = completed.length;

    if (pending.length === 0) {
      pendingTasksList.innerHTML = `<div class="card text-center text-muted text-sm" style="padding:1.5rem;">No pending tasks. Everything is in order.</div>`;
    } else {
      pendingTasksList.innerHTML = pending.map(t => {
        const dueDate = t.dueDate ? `📅 ${new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : '';
        return `
          <div class="task-item" id="task-${t.id}">
            <div style="display:flex; align-items:center; gap:0.65rem; flex:1; cursor:pointer;" class="open-task-btn" data-id="${t.id}">
              <span style="color:var(--text-muted);">○</span>
              <div>
                <div class="task-text" style="font-weight:500;">${escapeHtml(t.title)}</div>
                ${dueDate ? `<span class="text-xs text-muted">${dueDate}</span>` : ''}
              </div>
            </div>
            <div class="quick-action-btn-group">
              <button class="btn btn-secondary btn-sm task-done-btn" data-id="${t.id}" title="Mark Done">✓ Done</button>
              <button class="btn btn-secondary btn-sm task-tomorrow-btn" data-id="${t.id}" title="Postpone to tomorrow">Tomorrow</button>
              <button class="btn btn-ghost btn-sm text-muted task-skip-btn" data-id="${t.id}" title="Skip task">Skip</button>
            </div>
          </div>
        `;
      }).join('');
    }

    if (completed.length === 0) {
      completedTasksList.innerHTML = '';
    } else {
      completedTasksList.innerHTML = completed.map(t => `
        <div class="task-item completed" id="task-${t.id}">
          <div style="display:flex; align-items:center; gap:0.65rem;">
            <span style="color:var(--success); font-weight:700;">✓</span>
            <span class="task-text text-secondary">${escapeHtml(t.title)}</span>
          </div>
          <button class="btn btn-ghost btn-xs text-danger delete-task-btn" data-id="${t.id}">✕</button>
        </div>
      `).join('');
    }

    // Attach listeners
    document.querySelectorAll('.task-done-btn').forEach(b => {
      b.addEventListener('click', () => quickAction(b.dataset.id, 'DONE'));
    });
    document.querySelectorAll('.task-tomorrow-btn').forEach(b => {
      b.addEventListener('click', () => quickAction(b.dataset.id, 'TOMORROW'));
    });
    document.querySelectorAll('.task-skip-btn').forEach(b => {
      b.addEventListener('click', () => quickAction(b.dataset.id, 'SKIP'));
    });
    document.querySelectorAll('.open-task-btn').forEach(b => {
      b.addEventListener('click', () => openTaskModal(b.dataset.id));
    });
    document.querySelectorAll('.delete-task-btn').forEach(b => {
      b.addEventListener('click', () => deleteTask(b.dataset.id));
    });
  }

  async function quickAction(taskId, action) {
    try {
      await api.post(`/tasks/${taskId}/quick-action`, { action });
      showSuccess(action === 'DONE' ? 'Task completed! ✓' : 'Task postponed.');
      loadTasks();
    } catch (e) {
      showError('Action failed: ' + e.message);
    }
  }

  // Quick Add Form
  quickTaskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = quickTaskTitle.value.trim();
    if (!title) return;

    try {
      await api.post('/tasks', {
        title,
        dueDate: quickTaskDate.value || null,
        priority: quickTaskPriority.value,
        status: 'PENDING'
      });
      quickTaskTitle.value = '';
      quickTaskDate.value = '';
      showSuccess('Task added.');
      loadTasks();
    } catch (err) {
      showError("Couldn't add task: " + err.message);
    }
  });

  /* ── 2. GOALS LOGIC ────────────────────────────────────── */
  async function loadGoals() {
    try {
      const res = await api.get('/goals');
      allGoals = res?.data || [];
      renderGoals();
    } catch (e) {
      goalsList.innerHTML = `<p class="text-danger text-sm">Failed to load goals: ${escapeHtml(e.message)}</p>`;
    }
  }

  function renderGoals() {
    if (allGoals.length === 0) {
      goalsList.innerHTML = `
        <div class="card text-center" style="padding:2.5rem 1rem;">
          <p class="text-muted" style="margin-bottom:1rem;">No goals established yet.</p>
          <button class="btn btn-primary btn-sm" id="empty-goal-btn">+ Create your first goal</button>
        </div>
      `;
      document.getElementById('empty-goal-btn')?.addEventListener('click', () => openGoalModal());
      return;
    }

    goalsList.innerHTML = allGoals.map(g => {
      const pct = Math.min(100, Math.max(0, g.progress || 0));
      const targetStr = g.targetDate ? `Target: ${new Date(g.targetDate).toLocaleDateString()}` : '';
      const processes = g.processes || [];

      return `
        <div class="goal-card" id="goal-${g.id}">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.3rem;">
                <h3 style="font-size:1.1rem; font-weight:600;">${escapeHtml(g.title)}</h3>
                <span class="badge ${g.status === 'COMPLETED' ? 'badge-success' : 'badge-neutral'}">${g.status}</span>
              </div>
              ${g.description ? `<p class="text-xs text-secondary" style="margin-bottom:0.4rem;">${escapeHtml(g.description)}</p>` : ''}
              ${targetStr ? `<span class="text-xs text-muted">🎯 ${targetStr}</span>` : ''}
            </div>
            <div style="display:flex; gap:0.4rem;">
              <button class="btn btn-ghost btn-sm edit-goal-btn" data-id="${g.id}">Edit</button>
              <button class="btn btn-ghost btn-sm text-danger delete-goal-btn" data-id="${g.id}">Delete</button>
            </div>
          </div>

          <div style="margin-top:0.75rem;">
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-muted);">
              <span>Progress</span>
              <span>${pct}%</span>
            </div>
            <div class="progress-bar-wrap">
              <div class="progress-bar-fill" style="width:${pct}%;"></div>
            </div>
          </div>

          ${processes.length > 0 ? `
            <div style="margin-top:0.85rem;">
              <strong class="text-xs text-muted">Milestones:</strong>
              ${processes.map(p => `
                <div class="process-step">
                  <span>↳ ${escapeHtml(p.title)}</span>
                  <span class="badge badge-neutral">${p.progress}%</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    goalsList.querySelectorAll('.edit-goal-btn').forEach(b => {
      b.addEventListener('click', () => openGoalModal(b.dataset.id));
    });
    goalsList.querySelectorAll('.delete-goal-btn').forEach(b => {
      b.addEventListener('click', () => deleteGoal(b.dataset.id));
    });
  }

  /* ── 3. REMINDERS LOGIC ────────────────────────────────── */
  async function loadReminders() {
    try {
      const res = await api.get('/reminders');
      allReminders = res?.data || [];
      renderReminders();
    } catch (e) {
      remindersList.innerHTML = `<p class="text-danger text-sm">Failed to load reminders: ${escapeHtml(e.message)}</p>`;
    }
  }

  function renderReminders() {
    if (allReminders.length === 0) {
      remindersList.innerHTML = `<div class="card text-center text-muted text-sm" style="padding:2rem;">No reminders scheduled.</div>`;
      return;
    }

    remindersList.innerHTML = allReminders.map(r => {
      const d = new Date(r.remindAt);
      const timeStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="task-item" id="rem-${r.id}">
          <div>
            <div style="font-weight:500;">🔔 ${escapeHtml(r.title)}</div>
            <span class="text-xs text-muted">Time: ${timeStr}</span>
            ${r.repeatType !== 'NONE' ? `<span class="badge badge-neutral" style="margin-left:0.35rem;">🔁 ${r.repeatType}</span>` : ''}
          </div>
          <div style="display:flex; gap:0.35rem;">
            <button class="btn btn-secondary btn-sm ack-rem-btn" data-id="${r.id}">✓ Ack</button>
            <button class="btn btn-ghost btn-sm text-danger delete-rem-btn" data-id="${r.id}">Delete</button>
          </div>
        </div>
      `;
    }).join('');

    remindersList.querySelectorAll('.ack-rem-btn').forEach(b => {
      b.addEventListener('click', async () => {
        await api.post(`/reminders/${b.dataset.id}/acknowledge`);
        showSuccess('Acknowledged.');
      });
    });
    remindersList.querySelectorAll('.delete-rem-btn').forEach(b => {
      b.addEventListener('click', async () => {
        const ok = await showConfirmDialog('Delete Reminder?', 'Remove this reminder?');
        if (ok) {
          await api.delete(`/reminders/${b.dataset.id}`);
          showSuccess('Reminder removed.');
          loadReminders();
        }
      });
    });
  }

  /* ── 4. EVALUATIONS LOGIC ──────────────────────────────── */
  async function loadEvaluations() {
    try {
      const res = await api.get('/evaluations');
      allEvaluations = res?.data || [];
      renderEvaluations();
    } catch (e) {
      evaluationsList.innerHTML = `<p class="text-danger text-sm">Failed to load evaluations: ${escapeHtml(e.message)}</p>`;
    }
  }

  function renderEvaluations() {
    if (allEvaluations.length === 0) {
      evaluationsList.innerHTML = `<div class="card text-center text-muted text-sm" style="padding:2rem;">No evaluations recorded yet.</div>`;
      return;
    }

    evaluationsList.innerHTML = allEvaluations.map(ev => {
      const range = `${new Date(ev.periodStart).toLocaleDateString()} – ${new Date(ev.periodEnd).toLocaleDateString()}`;
      return `
        <div class="card" style="margin-bottom:1rem; padding:1.25rem;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div style="display:flex; gap:0.85rem; align-items:center;">
              <div class="score-badge">${ev.score || '—'}</div>
              <div>
                <strong>${ev.periodType} Reflection</strong>
                <div class="text-xs text-muted">${range}</div>
              </div>
            </div>
            <button class="btn btn-ghost btn-xs text-danger delete-eval-btn" data-id="${ev.id}">Delete</button>
          </div>
          <p style="margin-top:0.65rem; font-size:0.9rem; color:var(--text-secondary);">${escapeHtml(ev.summary)}</p>
        </div>
      `;
    }).join('');

    evaluationsList.querySelectorAll('.delete-eval-btn').forEach(b => {
      b.addEventListener('click', async () => {
        const ok = await showConfirmDialog('Delete Reflection?', 'Remove this evaluation?');
        if (ok) {
          await api.delete(`/evaluations/${b.dataset.id}`);
          showSuccess('Evaluation deleted.');
          loadEvaluations();
        }
      });
    });
  }

  /* ── 5. SEARCH GOALS & TASKS ───────────────────────────── */
  let searchTimer;
  goalsSearchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(async () => {
      const q = goalsSearchInput.value.trim();
      if (!q) {
        goalsSearchResults.innerHTML = '';
        return;
      }
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(q)}`);
        const tasks = res?.data?.tasks || [];
        const goals = res?.data?.goals || [];

        let html = '';
        if (tasks.length > 0) {
          html += `<h3 style="font-size:0.95rem; margin-bottom:0.5rem;">Tasks (${tasks.length})</h3>`;
          html += tasks.map(t => `<div class="task-item"><span style="font-weight:500;">${escapeHtml(t.title)}</span><span class="badge badge-neutral">${t.status}</span></div>`).join('');
        }
        if (goals.length > 0) {
          html += `<h3 style="font-size:0.95rem; margin:1rem 0 0.5rem;">Goals (${goals.length})</h3>`;
          html += goals.map(g => `<div class="task-item"><span style="font-weight:500;">${escapeHtml(g.title)}</span><span class="badge badge-neutral">${g.progress}%</span></div>`).join('');
        }
        if (tasks.length === 0 && goals.length === 0) {
          html = `<p class="text-muted text-center text-sm" style="padding:1.5rem;">No tasks or goals found for "${escapeHtml(q)}".</p>`;
        }
        goalsSearchResults.innerHTML = html;
      } catch (e) {
        goalsSearchResults.innerHTML = `<p class="text-danger text-sm">Search failed: ${escapeHtml(e.message)}</p>`;
      }
    }, 300);
  });

  /* ── MODAL HELPERS ─────────────────────────────────────── */
  // Task Modal
  function openTaskModal(id) {
    const t = allTasks.find(x => x.id == id);
    document.getElementById('task-modal-title').textContent = t ? 'Edit Task' : 'New Task';
    document.getElementById('task-id').value = t ? t.id : '';
    document.getElementById('task-title').value = t ? t.title : '';
    document.getElementById('task-desc').value = t ? (t.description || '') : '';
    document.getElementById('task-status').value = t ? t.status : 'PENDING';
    document.getElementById('task-priority').value = t ? t.priority : 'MEDIUM';
    document.getElementById('task-due-date').value = t ? (t.dueDate || '') : '';

    const delBtn = document.getElementById('task-delete-btn');
    if (t) {
      delBtn.classList.remove('hidden');
      delBtn.onclick = () => deleteTask(t.id);
    } else {
      delBtn.classList.add('hidden');
    }
    taskModal.classList.add('active');
  }

  document.getElementById('btn-add-task')?.addEventListener('click', () => openTaskModal());
  document.getElementById('close-task-modal')?.addEventListener('click', () => taskModal.classList.remove('active'));
  document.getElementById('task-cancel-btn')?.addEventListener('click', () => taskModal.classList.remove('active'));

  document.getElementById('task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('task-id').value;
    const payload = {
      title: document.getElementById('task-title').value.trim(),
      description: document.getElementById('task-desc').value.trim(),
      status: document.getElementById('task-status').value,
      priority: document.getElementById('task-priority').value,
      dueDate: document.getElementById('task-due-date').value || null
    };
    try {
      if (id) {
        await api.put(`/tasks/${id}`, payload);
        showSuccess('Task updated.');
      } else {
        await api.post('/tasks', payload);
        showSuccess('Task created.');
      }
      taskModal.classList.remove('active');
      loadTasks();
    } catch (err) {
      showError("Couldn't save task: " + err.message);
    }
  });

  async function deleteTask(id) {
    const ok = await showConfirmDialog('Delete Task?', 'Are you sure you want to remove this task?');
    if (ok) {
      await api.delete(`/tasks/${id}`);
      showSuccess('Task deleted.');
      taskModal.classList.remove('active');
      loadTasks();
    }
  }

  // Goal Modal
  function openGoalModal(id) {
    const g = allGoals.find(x => x.id == id);
    document.getElementById('goal-modal-title').textContent = g ? 'Edit Goal' : 'New Goal';
    document.getElementById('goal-id').value = g ? g.id : '';
    document.getElementById('goal-title').value = g ? g.title : '';
    document.getElementById('goal-desc').value = g ? (g.description || '') : '';
    document.getElementById('goal-status').value = g ? g.status : 'ACTIVE';
    document.getElementById('goal-progress').value = g ? (g.progress || 0) : 0;
    document.getElementById('goal-target-date').value = g ? (g.targetDate || '') : '';
    goalModal.classList.add('active');
  }

  document.getElementById('btn-add-goal')?.addEventListener('click', () => openGoalModal());
  document.getElementById('close-goal-modal')?.addEventListener('click', () => goalModal.classList.remove('active'));
  document.getElementById('goal-cancel-btn')?.addEventListener('click', () => goalModal.classList.remove('active'));

  document.getElementById('goal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('goal-id').value;
    const payload = {
      title: document.getElementById('goal-title').value.trim(),
      description: document.getElementById('goal-desc').value.trim(),
      status: document.getElementById('goal-status').value,
      progress: Number(document.getElementById('goal-progress').value) || 0,
      targetDate: document.getElementById('goal-target-date').value || null
    };
    try {
      if (id) {
        await api.put(`/goals/${id}`, payload);
        showSuccess('Goal updated.');
      } else {
        await api.post('/goals', payload);
        showSuccess('Goal created.');
      }
      goalModal.classList.remove('active');
      loadGoals();
    } catch (err) {
      showError("Couldn't save goal: " + err.message);
    }
  });

  async function deleteGoal(id) {
    const ok = await showConfirmDialog('Delete Goal?', 'Are you sure you want to delete this goal?');
    if (ok) {
      await api.delete(`/goals/${id}`);
      showSuccess('Goal deleted.');
      loadGoals();
    }
  }

  // Reminder Modal
  document.getElementById('btn-add-reminder')?.addEventListener('click', () => {
    document.getElementById('reminder-id').value = '';
    document.getElementById('reminder-title').value = '';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    document.getElementById('reminder-time').value = tomorrow.toISOString().slice(0, 16);
    reminderModal.classList.add('active');
  });
  document.getElementById('close-reminder-modal')?.addEventListener('click', () => reminderModal.classList.remove('active'));
  document.getElementById('reminder-cancel-btn')?.addEventListener('click', () => reminderModal.classList.remove('active'));

  document.getElementById('reminder-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      title: document.getElementById('reminder-title').value.trim(),
      remindAt: document.getElementById('reminder-time').value,
      repeatType: document.getElementById('reminder-repeat').value
    };
    try {
      await api.post('/reminders', payload);
      showSuccess('Reminder scheduled.');
      reminderModal.classList.remove('active');
      loadReminders();
    } catch (err) {
      showError("Couldn't schedule reminder: " + err.message);
    }
  });

  // Evaluation Modal
  document.getElementById('btn-add-evaluation')?.addEventListener('click', () => {
    document.getElementById('eval-summary').value = '';
    document.getElementById('eval-score').value = 8;
    document.getElementById('eval-score-num').textContent = '8';
    evalModal.classList.add('active');
  });
  document.getElementById('close-eval-modal')?.addEventListener('click', () => evalModal.classList.remove('active'));
  document.getElementById('eval-cancel-btn')?.addEventListener('click', () => evalModal.classList.remove('active'));
  document.getElementById('eval-score').addEventListener('input', (e) => {
    document.getElementById('eval-score-num').textContent = e.target.value;
  });

  document.getElementById('eval-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];
    const payload = {
      periodType: document.getElementById('eval-period-type').value,
      periodStart: today,
      periodEnd: today,
      summary: document.getElementById('eval-summary').value.trim(),
      score: Number(document.getElementById('eval-score').value)
    };
    try {
      await api.post('/evaluations', payload);
      showSuccess('Reflection recorded.');
      evalModal.classList.remove('active');
      loadEvaluations();
    } catch (err) {
      showError("Couldn't save reflection: " + err.message);
    }
  });

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  loadTasks();
});
