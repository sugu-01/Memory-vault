/* ============================================================
   Memory Vault — Self-Evaluation Script (evaluate.js)
   Daily, weekly, and monthly self-assessments.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  initNav('Evaluate');

  let evaluations = [];
  let currentPeriod = '';

  const container = document.getElementById('evaluations-container');
  const modal = document.getElementById('eval-modal');
  const modalTitle = document.getElementById('eval-modal-title');
  const evalForm = document.getElementById('eval-form');
  const evalId = document.getElementById('eval-id');
  const evalPeriodType = document.getElementById('eval-period-type');
  const evalScore = document.getElementById('eval-score');
  const scoreDisplay = document.getElementById('score-display');
  const evalPeriodStart = document.getElementById('eval-period-start');
  const evalPeriodEnd = document.getElementById('eval-period-end');
  const evalSummary = document.getElementById('eval-summary');
  const evalAchievements = document.getElementById('eval-achievements');
  const evalImprovements = document.getElementById('eval-improvements');
  const evalError = document.getElementById('eval-error-msg');
  const saveBtn = document.getElementById('save-eval-btn');
  const periodBtns = document.querySelectorAll('.eval-period-btn');

  // Slider update
  evalScore.addEventListener('input', () => {
    scoreDisplay.textContent = evalScore.value;
  });

  // Auto-fill dates based on period selection
  evalPeriodType.addEventListener('change', () => {
    setDefaultDates(evalPeriodType.value);
  });

  function setDefaultDates(period) {
    const today = new Date();
    const endStr = today.toISOString().split('T')[0];
    evalPeriodEnd.value = endStr;

    const start = new Date(today);
    if (period === 'WEEKLY') {
      start.setDate(today.getDate() - 7);
    } else if (period === 'MONTHLY') {
      start.setMonth(today.getMonth() - 1);
    }
    evalPeriodStart.value = start.toISOString().split('T')[0];
  }

  async function loadEvaluations() {
    try {
      let url = '/evaluations';
      if (currentPeriod) url += `?periodType=${currentPeriod}`;
      const res = await api.get(url);
      evaluations = res?.data || [];
      render();
    } catch (e) {
      container.innerHTML = `<div class="card text-center text-danger" style="padding:2rem;">Failed to load evaluations: ${e.message}</div>`;
    }
  }

  function render() {
    if (evaluations.length === 0) {
      container.innerHTML = `
        <div class="card text-center" style="padding:3rem 1rem;">
          <p class="text-muted" style="margin-bottom:1rem;">No evaluations recorded for this timeframe.</p>
          <button class="btn btn-primary" id="empty-eval-btn">+ Create Evaluation</button>
        </div>
      `;
      document.getElementById('empty-eval-btn')?.addEventListener('click', openCreateModal);
      return;
    }

    container.innerHTML = evaluations.map(ev => {
      const periodLabel = ev.periodType || 'EVALUATION';
      const dateRange = `${new Date(ev.periodStart).toLocaleDateString()} – ${new Date(ev.periodEnd).toLocaleDateString()}`;

      return `
        <div class="eval-card" id="eval-${ev.id}">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div style="display:flex; gap:1rem; align-items:center;">
              <div class="score-badge" title="Overall Score">${ev.score || '—'}</div>
              <div>
                <div style="display:flex; gap:0.5rem; align-items:center;">
                  <strong style="font-size:1.05rem;">${periodLabel} Reflection</strong>
                  <span class="text-xs text-muted">📅 ${dateRange}</span>
                </div>
                <p style="margin-top:0.4rem; color:var(--text-secondary); font-size:0.95rem;">${escapeHtml(ev.summary)}</p>
              </div>
            </div>
            <div style="display:flex; gap:0.4rem;">
              <button class="btn btn-ghost btn-sm edit-eval-btn" data-id="${ev.id}">Edit</button>
              <button class="btn btn-ghost btn-sm text-danger delete-eval-btn" data-id="${ev.id}">Delete</button>
            </div>
          </div>

          ${(ev.achievements || ev.improvements) ? `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-top:1rem; padding-top:0.75rem; border-top:1px solid var(--border); font-size:0.85rem;">
              ${ev.achievements ? `
                <div style="background:rgba(16,185,129,0.06); padding:0.6rem 0.8rem; border-radius:var(--radius-sm); border:1px solid rgba(16,185,129,0.2);">
                  <strong style="color:var(--success);">🏆 Achievements:</strong>
                  <p style="margin-top:0.25rem;">${escapeHtml(ev.achievements)}</p>
                </div>
              ` : '<div></div>'}
              ${ev.improvements ? `
                <div style="background:rgba(245,158,11,0.06); padding:0.6rem 0.8rem; border-radius:var(--radius-sm); border:1px solid rgba(245,158,11,0.2);">
                  <strong style="color:var(--warning);">🌱 Next Focus / Growth:</strong>
                  <p style="margin-top:0.25rem;">${escapeHtml(ev.improvements)}</p>
                </div>
              ` : '<div></div>'}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    container.querySelectorAll('.edit-eval-btn').forEach(b => {
      b.addEventListener('click', () => openEditModal(b.dataset.id));
    });

    container.querySelectorAll('.delete-eval-btn').forEach(b => {
      b.addEventListener('click', () => deleteEvaluation(b.dataset.id));
    });
  }

  // Filter tabs
  periodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      periodBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPeriod = btn.dataset.period;
      loadEvaluations();
    });
  });

  // Modal open/close
  function openCreateModal() {
    modalTitle.textContent = 'New Evaluation';
    evalId.value = '';
    evalPeriodType.value = currentPeriod || 'DAILY';
    setDefaultDates(evalPeriodType.value);
    evalScore.value = 8;
    scoreDisplay.textContent = '8';
    evalSummary.value = '';
    evalAchievements.value = '';
    evalImprovements.value = '';
    evalError.classList.add('hidden');
    modal.classList.add('active');
  }

  function openEditModal(id) {
    const ev = evaluations.find(x => x.id == id);
    if (!ev) return;

    modalTitle.textContent = 'Edit Evaluation';
    evalId.value = ev.id;
    evalPeriodType.value = ev.periodType;
    evalScore.value = ev.score || 8;
    scoreDisplay.textContent = ev.score || '8';
    evalPeriodStart.value = ev.periodStart;
    evalPeriodEnd.value = ev.periodEnd;
    evalSummary.value = ev.summary || '';
    evalAchievements.value = ev.achievements || '';
    evalImprovements.value = ev.improvements || '';
    evalError.classList.add('hidden');
    modal.classList.add('active');
  }

  function closeModal() {
    modal.classList.remove('active');
  }

  document.getElementById('open-new-eval-btn')?.addEventListener('click', openCreateModal);
  document.getElementById('close-eval-modal-btn')?.addEventListener('click', closeModal);
  document.getElementById('cancel-eval-btn')?.addEventListener('click', closeModal);

  // Form Submit
  evalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = evalId.value;
    const isEdit = !!id;

    const payload = {
      periodType: evalPeriodType.value,
      periodStart: evalPeriodStart.value,
      periodEnd: evalPeriodEnd.value,
      summary: evalSummary.value.trim(),
      achievements: evalAchievements.value.trim(),
      improvements: evalImprovements.value.trim(),
      score: Number(evalScore.value)
    };

    setButtonLoading(saveBtn, true, 'Saving...');
    evalError.classList.add('hidden');

    try {
      if (isEdit) {
        await api.put(`/evaluations/${id}`, payload);
        showSuccess('Evaluation updated.');
      } else {
        await api.post('/evaluations', payload);
        showSuccess('Evaluation recorded safely.');
      }
      closeModal();
      loadEvaluations();
    } catch (err) {
      evalError.textContent = err.message || "Couldn't save evaluation.";
      evalError.classList.remove('hidden');
    } finally {
      setButtonLoading(saveBtn, false, 'Save Evaluation');
    }
  });

  // Delete
  async function deleteEvaluation(id) {
    const confirmed = await showConfirmDialog(
      'Delete Evaluation?',
      'Are you sure you want to delete this evaluation?'
    );
    if (!confirmed) return;

    try {
      await api.delete(`/evaluations/${id}`);
      showSuccess('Evaluation deleted.');
      loadEvaluations();
    } catch (e) {
      showError('Failed to delete evaluation: ' + e.message);
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  loadEvaluations();
});
