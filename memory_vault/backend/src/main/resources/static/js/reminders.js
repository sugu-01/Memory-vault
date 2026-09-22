/* ============================================================
   Memory Vault — Reminders Script (reminders.js)
   Create, edit, acknowledge, history, soft-delete.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  initNav('Reminders');

  let reminders = [];

  const container = document.getElementById('reminders-container');
  const modal = document.getElementById('reminder-modal');
  const modalTitle = document.getElementById('reminder-modal-title');
  const reminderForm = document.getElementById('reminder-form');
  const reminderId = document.getElementById('reminder-id');
  const reminderTitle = document.getElementById('reminder-title');
  const reminderDesc = document.getElementById('reminder-desc');
  const reminderTime = document.getElementById('reminder-time');
  const reminderRepeat = document.getElementById('reminder-repeat');
  const reminderError = document.getElementById('reminder-error-msg');
  const saveBtn = document.getElementById('save-reminder-btn');

  const historyModal = document.getElementById('history-modal');
  const historyList = document.getElementById('history-list');

  // Load reminders
  async function loadReminders() {
    try {
      const res = await api.get('/reminders');
      reminders = res?.data || [];
      render();
    } catch (e) {
      container.innerHTML = `<div class="card text-center text-danger" style="padding:2rem;">Failed to load reminders: ${e.message}</div>`;
    }
  }

  function render() {
    if (reminders.length === 0) {
      container.innerHTML = `
        <div class="card text-center" style="padding: 3rem 1rem;">
          <p class="text-muted" style="margin-bottom:1rem;">No reminders set.</p>
          <button class="btn btn-primary" id="empty-set-reminder-btn">+ Set a reminder</button>
        </div>
      `;
      document.getElementById('empty-set-reminder-btn')?.addEventListener('click', openCreateModal);
      return;
    }

    container.innerHTML = reminders.map(r => {
      const d = new Date(r.remindAt);
      const formatted = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
        ' at ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const isPast = d < new Date();

      return `
        <div class="reminder-card${!r.isActive ? ' inactive' : ''}" id="reminder-${r.id}">
          <div>
            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.35rem;">
              <span style="font-size:1.2rem;">🔔</span>
              <strong style="font-size:1.05rem;">${escapeHtml(r.title)}</strong>
              ${r.repeatType !== 'NONE' ? `<span class="badge badge-info">🔁 ${r.repeatType}</span>` : ''}
              ${isPast ? `<span class="badge badge-warning">Due</span>` : ''}
            </div>
            ${r.description ? `<p class="text-secondary text-xs" style="margin-bottom:0.3rem;">${escapeHtml(r.description)}</p>` : ''}
            <span class="text-xs text-muted">⏰ Remind: ${formatted}</span>
          </div>
          <div style="display:flex; gap:0.4rem; align-items:center;">
            <button class="btn btn-secondary btn-sm ack-btn" data-id="${r.id}" title="Acknowledge trigger">✓ Ack</button>
            <button class="btn btn-ghost btn-sm view-hist-btn" data-id="${r.id}" title="View Trigger History">History</button>
            <button class="btn btn-ghost btn-sm edit-btn" data-id="${r.id}">Edit</button>
            <button class="btn btn-ghost btn-sm text-danger delete-btn" data-id="${r.id}">Delete</button>
          </div>
        </div>
      `;
    }).join('');

    // Attach handlers
    container.querySelectorAll('.ack-btn').forEach(b => {
      b.addEventListener('click', () => acknowledgeReminder(b.dataset.id));
    });

    container.querySelectorAll('.view-hist-btn').forEach(b => {
      b.addEventListener('click', () => openHistoryModal(b.dataset.id));
    });

    container.querySelectorAll('.edit-btn').forEach(b => {
      b.addEventListener('click', () => openEditModal(b.dataset.id));
    });

    container.querySelectorAll('.delete-btn').forEach(b => {
      b.addEventListener('click', () => deleteReminder(b.dataset.id));
    });
  }

  // Acknowledge
  async function acknowledgeReminder(id) {
    try {
      await api.post(`/reminders/${id}/acknowledge`);
      showSuccess('Reminder acknowledged & recorded in history.');
    } catch (e) {
      showError('Failed to acknowledge: ' + e.message);
    }
  }

  // View history
  async function openHistoryModal(id) {
    historyList.innerHTML = `<p class="text-muted"><span class="spinner"></span> Loading history...</p>`;
    historyModal.classList.add('active');

    try {
      const res = await api.get(`/reminders/${id}/history`);
      const list = res?.data || [];
      if (list.length === 0) {
        historyList.innerHTML = `<p class="text-muted">No history records found for this reminder.</p>`;
        return;
      }
      historyList.innerHTML = list.map(h => `
        <div class="history-item">
          <span>Triggered: ${new Date(h.triggeredAt).toLocaleString()}</span>
          <span class="badge ${h.acknowledged ? 'badge-success' : 'badge-neutral'}">
            ${h.acknowledged ? 'Acknowledged' : 'Pending'}
          </span>
        </div>
      `).join('');
    } catch (e) {
      historyList.innerHTML = `<p class="text-danger">Failed to load history: ${e.message}</p>`;
    }
  }

  // Modal open/close
  function openCreateModal() {
    modalTitle.textContent = 'Set New Reminder';
    reminderId.value = '';
    reminderTitle.value = '';
    reminderDesc.value = '';
    reminderRepeat.value = 'NONE';

    // Default to tomorrow 9:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    reminderTime.value = tomorrow.toISOString().slice(0, 16);

    reminderError.classList.add('hidden');
    modal.classList.add('active');
  }

  function openEditModal(id) {
    const r = reminders.find(x => x.id == id);
    if (!r) return;

    modalTitle.textContent = 'Edit Reminder';
    reminderId.value = r.id;
    reminderTitle.value = r.title;
    reminderDesc.value = r.description || '';
    reminderRepeat.value = r.repeatType || 'NONE';
    reminderTime.value = r.remindAt ? r.remindAt.slice(0, 16) : '';

    reminderError.classList.add('hidden');
    modal.classList.add('active');
  }

  function closeModal() {
    modal.classList.remove('active');
  }

  document.getElementById('open-new-reminder-btn')?.addEventListener('click', openCreateModal);
  document.getElementById('close-reminder-modal-btn')?.addEventListener('click', closeModal);
  document.getElementById('cancel-reminder-btn')?.addEventListener('click', closeModal);
  document.getElementById('close-history-modal-btn')?.addEventListener('click', () => historyModal.classList.remove('active'));

  // Form Submit
  reminderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = reminderId.value;
    const isEdit = !!id;

    const payload = {
      title: reminderTitle.value.trim(),
      description: reminderDesc.value.trim(),
      remindAt: reminderTime.value,
      repeatType: reminderRepeat.value
    };

    setButtonLoading(saveBtn, true, 'Saving...');
    reminderError.classList.add('hidden');

    try {
      if (isEdit) {
        await api.put(`/reminders/${id}`, payload);
        showSuccess('Reminder updated.');
      } else {
        await api.post('/reminders', payload);
        showSuccess('Reminder scheduled safely.');
      }
      closeModal();
      loadReminders();
    } catch (err) {
      reminderError.textContent = err.message || "Couldn't save reminder.";
      reminderError.classList.remove('hidden');
    } finally {
      setButtonLoading(saveBtn, false, 'Save Reminder');
    }
  });

  // Delete
  async function deleteReminder(id) {
    const confirmed = await showConfirmDialog(
      'Delete Reminder?',
      'Are you sure you want to delete this reminder?'
    );
    if (!confirmed) return;

    try {
      await api.delete(`/reminders/${id}`);
      showSuccess('Reminder removed.');
      loadReminders();
    } catch (err) {
      showError(err.message || 'Failed to delete reminder.');
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  loadReminders();
});
