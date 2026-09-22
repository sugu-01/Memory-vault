/* ============================================================
   Memory Vault — Goals Script (goals.js)
   Goals, nested processes, and progress logs.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  initNav('Goals');

  let goals = [];

  const container = document.getElementById('goals-container');
  const goalModal = document.getElementById('goal-modal');
  const goalModalTitle = document.getElementById('goal-modal-title');
  const goalForm = document.getElementById('goal-form');
  const goalId = document.getElementById('goal-id');
  const goalTitle = document.getElementById('goal-title');
  const goalDesc = document.getElementById('goal-desc');
  const goalStatus = document.getElementById('goal-status');
  const goalProgress = document.getElementById('goal-progress');
  const goalStartDate = document.getElementById('goal-start-date');
  const goalTargetDate = document.getElementById('goal-target-date');
  const goalError = document.getElementById('goal-error-msg');
  const saveGoalBtn = document.getElementById('save-goal-btn');

  const processModal = document.getElementById('process-modal');
  const processForm = document.getElementById('process-form');
  const processGoalId = document.getElementById('process-goal-id');
  const processTitle = document.getElementById('process-title');
  const processProgress = document.getElementById('process-progress');
  const saveProcessBtn = document.getElementById('save-process-btn');

  const logModal = document.getElementById('log-modal');
  const logForm = document.getElementById('log-form');
  const logGoalId = document.getElementById('log-goal-id');
  const logDate = document.getElementById('log-date');
  const logProgressVal = document.getElementById('log-progress-val');
  const logNote = document.getElementById('log-note');

  logDate.value = new Date().toISOString().split('T')[0];

  async function loadGoals() {
    try {
      const res = await api.get('/goals');
      goals = res?.data || [];
      render();
    } catch (e) {
      container.innerHTML = `<div class="card text-center text-danger" style="padding:2rem;">Failed to load goals: ${e.message}</div>`;
    }
  }

  function render() {
    if (goals.length === 0) {
      container.innerHTML = `
        <div class="card text-center" style="padding:3rem 1rem;">
          <p class="text-muted" style="margin-bottom:1rem;">No goals established yet.</p>
          <button class="btn btn-primary" id="empty-goal-btn">+ Establish your first goal</button>
        </div>
      `;
      document.getElementById('empty-goal-btn')?.addEventListener('click', openCreateGoalModal);
      return;
    }

    container.innerHTML = goals.map(g => {
      const targetStr = g.targetDate ? `Target: ${new Date(g.targetDate).toLocaleDateString()}` : '';
      const processes = g.processes || [];

      const processesHTML = processes.map(p => `
        <div class="process-item" id="process-${p.id}">
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span>↳</span>
            <span>${escapeHtml(p.title)}</span>
            <span class="badge ${p.progress >= 100 ? 'badge-success' : 'badge-neutral'}">${p.progress}%</span>
          </div>
          <button class="btn btn-ghost btn-xs text-danger delete-process-btn" data-goal="${g.id}" data-id="${p.id}">✕</button>
        </div>
      `).join('');

      return `
        <div class="goal-card" id="goal-${g.id}">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem;">
                <h3 style="font-size:1.15rem; font-weight:700;">${escapeHtml(g.title)}</h3>
                <span class="badge ${g.status === 'COMPLETED' ? 'badge-success' : 'badge-info'}">${g.status}</span>
              </div>
              ${g.description ? `<p class="text-secondary text-xs" style="margin-bottom:0.4rem;">${escapeHtml(g.description)}</p>` : ''}
              ${targetStr ? `<span class="text-xs text-muted">🎯 ${targetStr}</span>` : ''}
            </div>
            <div style="display:flex; gap:0.4rem;">
              <button class="btn btn-secondary btn-sm log-progress-btn" data-id="${g.id}">+ Log Progress</button>
              <button class="btn btn-ghost btn-sm add-process-btn" data-id="${g.id}">+ Step</button>
              <button class="btn btn-ghost btn-sm edit-goal-btn" data-id="${g.id}">Edit</button>
              <button class="btn btn-ghost btn-sm text-danger delete-goal-btn" data-id="${g.id}">Delete</button>
            </div>
          </div>

          <div style="margin-top:0.75rem;">
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-muted);">
              <span>Progress</span>
              <span>${g.progress || 0}%</span>
            </div>
            <div class="progress-bar-wrap">
              <div class="progress-bar-fill" style="width: ${Math.min(100, g.progress || 0)}%;"></div>
            </div>
          </div>

          ${processes.length > 0 ? `
            <div style="margin-top:0.75rem;">
              <strong class="text-xs text-muted">Milestone Steps:</strong>
              ${processesHTML}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    // Attach listeners
    container.querySelectorAll('.log-progress-btn').forEach(b => {
      b.addEventListener('click', () => openLogModal(b.dataset.id));
    });

    container.querySelectorAll('.add-process-btn').forEach(b => {
      b.addEventListener('click', () => openProcessModal(b.dataset.id));
    });

    container.querySelectorAll('.edit-goal-btn').forEach(b => {
      b.addEventListener('click', () => openEditGoalModal(b.dataset.id));
    });

    container.querySelectorAll('.delete-goal-btn').forEach(b => {
      b.addEventListener('click', () => deleteGoal(b.dataset.id));
    });

    container.querySelectorAll('.delete-process-btn').forEach(b => {
      b.addEventListener('click', () => deleteProcess(b.dataset.goal, b.dataset.id));
    });
  }

  // Goal Modal
  function openCreateGoalModal() {
    goalModalTitle.textContent = 'Create New Goal';
    goalId.value = '';
    goalTitle.value = '';
    goalDesc.value = '';
    goalStatus.value = 'ACTIVE';
    goalProgress.value = 0;
    goalStartDate.value = new Date().toISOString().split('T')[0];
    goalTargetDate.value = '';
    goalError.classList.add('hidden');
    goalModal.classList.add('active');
  }

  function openEditGoalModal(id) {
    const g = goals.find(x => x.id == id);
    if (!g) return;

    goalModalTitle.textContent = 'Edit Goal';
    goalId.value = g.id;
    goalTitle.value = g.title;
    goalDesc.value = g.description || '';
    goalStatus.value = g.status || 'ACTIVE';
    goalProgress.value = g.progress || 0;
    goalStartDate.value = g.startDate || '';
    goalTargetDate.value = g.targetDate || '';
    goalError.classList.add('hidden');
    goalModal.classList.add('active');
  }

  document.getElementById('open-new-goal-btn')?.addEventListener('click', openCreateGoalModal);
  document.getElementById('close-goal-modal-btn')?.addEventListener('click', () => goalModal.classList.remove('active'));
  document.getElementById('cancel-goal-btn')?.addEventListener('click', () => goalModal.classList.remove('active'));

  goalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = goalId.value;
    const isEdit = !!id;

    const payload = {
      title: goalTitle.value.trim(),
      description: goalDesc.value.trim(),
      status: goalStatus.value,
      progress: Number(goalProgress.value) || 0,
      startDate: goalStartDate.value || null,
      targetDate: goalTargetDate.value || null
    };

    setButtonLoading(saveGoalBtn, true, 'Saving...');
    goalError.classList.add('hidden');

    try {
      if (isEdit) {
        await api.put(`/goals/${id}`, payload);
        showSuccess('Goal updated.');
      } else {
        await api.post('/goals', payload);
        showSuccess('Goal created.');
      }
      goalModal.classList.remove('active');
      loadGoals();
    } catch (err) {
      goalError.textContent = err.message || "Couldn't save goal.";
      goalError.classList.remove('hidden');
    } finally {
      setButtonLoading(saveGoalBtn, false, 'Save Goal');
    }
  });

  // Process Modal
  function openProcessModal(gId) {
    processGoalId.value = gId;
    processTitle.value = '';
    processProgress.value = 0;
    processModal.classList.add('active');
  }

  document.getElementById('close-process-modal-btn')?.addEventListener('click', () => processModal.classList.remove('active'));
  document.getElementById('cancel-process-btn')?.addEventListener('click', () => processModal.classList.remove('active'));

  processForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const gId = processGoalId.value;
    const payload = {
      title: processTitle.value.trim(),
      progress: Number(processProgress.value) || 0
    };

    setButtonLoading(saveProcessBtn, true, 'Saving...');
    try {
      await api.post(`/goals/${gId}/processes`, payload);
      showSuccess('Process step added.');
      processModal.classList.remove('active');
      loadGoals();
    } catch (err) {
      showError(err.message || 'Failed to add step.');
    } finally {
      setButtonLoading(saveProcessBtn, false, 'Save Step');
    }
  });

  // Log Progress Modal
  function openLogModal(gId) {
    logGoalId.value = gId;
    logProgressVal.value = '';
    logNote.value = '';
    logModal.classList.add('active');
  }

  document.getElementById('close-log-modal-btn')?.addEventListener('click', () => logModal.classList.remove('active'));
  document.getElementById('cancel-log-btn')?.addEventListener('click', () => logModal.classList.remove('active'));

  logForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const gId = logGoalId.value;
    const payload = {
      goalId: Number(gId),
      logDate: logDate.value,
      progressValue: logProgressVal.value ? Number(logProgressVal.value) : null,
      note: logNote.value.trim()
    };

    try {
      await api.post('/progress', payload);
      // Also update goal's progress if specified
      if (payload.progressValue !== null) {
        const g = goals.find(x => x.id == gId);
        if (g) {
          await api.put(`/goals/${gId}`, {
            title: g.title,
            description: g.description,
            status: g.status,
            progress: payload.progressValue,
            startDate: g.startDate,
            targetDate: g.targetDate
          });
        }
      }
      showSuccess('Progress recorded successfully.');
      logModal.classList.remove('active');
      loadGoals();
    } catch (err) {
      showError(err.message || 'Failed to log progress.');
    }
  });

  // Deletions with safe confirmation
  async function deleteGoal(id) {
    const confirmed = await showConfirmDialog(
      'Delete Goal?',
      'Are you sure you want to delete this goal and all associated steps?'
    );
    if (!confirmed) return;

    try {
      await api.delete(`/goals/${id}`);
      showSuccess('Goal deleted.');
      loadGoals();
    } catch (e) {
      showError('Failed to delete goal: ' + e.message);
    }
  }

  async function deleteProcess(goalId, procId) {
    const confirmed = await showConfirmDialog(
      'Remove Step?',
      'Are you sure you want to delete this step?'
    );
    if (!confirmed) return;

    try {
      await api.delete(`/goals/${goalId}/processes/${procId}`);
      showSuccess('Step removed.');
      loadGoals();
    } catch (e) {
      showError('Failed to delete step: ' + e.message);
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  loadGoals();
});
