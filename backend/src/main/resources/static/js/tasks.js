/* ============================================================
   Memory Vault — Tasks Script (tasks.js)
   Kanban & List view, status toggle, soft-delete.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  initNav('Tasks');

  let tasks = [];
  let isKanbanView = true;

  // DOM Elements
  const kanbanView = document.getElementById('kanban-view');
  const listView = document.getElementById('list-view');
  const toggleViewBtn = document.getElementById('toggle-view-btn');
  const taskTableContainer = document.getElementById('task-table-container');

  const listPending = document.getElementById('list-pending');
  const listInProgress = document.getElementById('list-in-progress');
  const listCompleted = document.getElementById('list-completed');

  const countPending = document.getElementById('count-pending');
  const countInProgress = document.getElementById('count-in-progress');
  const countCompleted = document.getElementById('count-completed');

  const quickAddForm = document.getElementById('quick-add-form');
  const quickTaskTitle = document.getElementById('quick-task-title');
  const quickTaskPriority = document.getElementById('quick-task-priority');
  const quickTaskDate = document.getElementById('quick-task-date');
  const quickAddBtn = document.getElementById('quick-add-btn');

  const modal = document.getElementById('task-modal');
  const taskModalTitle = document.getElementById('task-modal-title');
  const taskForm = document.getElementById('task-form');
  const taskIdField = document.getElementById('task-id');
  const taskTitle = document.getElementById('task-title');
  const taskDesc = document.getElementById('task-desc');
  const taskStatus = document.getElementById('task-status');
  const taskPriority = document.getElementById('task-priority');
  const taskDueDate = document.getElementById('task-due-date');
  const taskError = document.getElementById('task-error-msg');
  const deleteTaskBtn = document.getElementById('delete-task-btn');
  const saveTaskBtn = document.getElementById('save-task-btn');

  // Load Tasks
  async function loadTasks() {
    try {
      const res = await api.get('/tasks');
      tasks = res?.data || [];
      render();
    } catch (e) {
      showError('Failed to load tasks: ' + e.message);
    }
  }

  function render() {
    if (isKanbanView) {
      renderKanban();
    } else {
      renderList();
    }
  }

  function renderKanban() {
    const pending = tasks.filter(t => t.status === 'PENDING');
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS');
    const completed = tasks.filter(t => t.status === 'COMPLETED');

    countPending.textContent = pending.length;
    countInProgress.textContent = inProgress.length;
    countCompleted.textContent = completed.length;

    listPending.innerHTML = pending.map(t => createTaskCard(t)).join('');
    listInProgress.innerHTML = inProgress.map(t => createTaskCard(t)).join('');
    listCompleted.innerHTML = completed.map(t => createTaskCard(t)).join('');

    attachCardListeners();
  }

  function createTaskCard(t) {
    const dueDateStr = t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '';
    const isOverdue = t.dueDate && t.status !== 'COMPLETED' && new Date(t.dueDate) < new Date().setHours(0,0,0,0);

    return `
      <div class="task-card${t.status === 'COMPLETED' ? ' completed' : ''}" data-id="${t.id}">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.35rem;">
          <span class="badge badge-priority-${t.priority}">${t.priority}</span>
          ${dueDateStr ? `<span class="text-xs ${isOverdue ? 'text-danger font-semibold' : 'text-muted'}">📅 ${dueDateStr}</span>` : ''}
        </div>
        <div class="task-title" style="font-weight:600; margin-bottom:0.3rem;">${escapeHtml(t.title)}</div>
        ${t.description ? `<div class="text-xs text-secondary" style="margin-bottom:0.5rem; max-height:40px; overflow:hidden;">${escapeHtml(t.description)}</div>` : ''}
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem; border-top:1px solid var(--border); padding-top:0.4rem;">
          <select class="status-quick-select" data-id="${t.id}" style="width:auto; padding:0.2rem 0.4rem; font-size:0.75rem;">
            <option value="PENDING" ${t.status === 'PENDING' ? 'selected' : ''}>Pending</option>
            <option value="IN_PROGRESS" ${t.status === 'IN_PROGRESS' ? 'selected' : ''}>In Progress</option>
            <option value="COMPLETED" ${t.status === 'COMPLETED' ? 'selected' : ''}>Completed</option>
          </select>
          <button class="btn btn-ghost btn-xs text-danger delete-task-quick" data-id="${t.id}">✕</button>
        </div>
      </div>
    `;
  }

  function renderList() {
    if (tasks.length === 0) {
      taskTableContainer.innerHTML = `<p class="text-muted text-center" style="padding:2rem;">No tasks found.</p>`;
      return;
    }

    taskTableContainer.innerHTML = `
      <table style="width:100%; border-collapse:collapse; font-size:0.875rem;">
        <thead>
          <tr style="border-bottom:1px solid var(--border); text-align:left; color:var(--text-muted);">
            <th style="padding:0.6rem;">Status</th>
            <th style="padding:0.6rem;">Task</th>
            <th style="padding:0.6rem;">Priority</th>
            <th style="padding:0.6rem;">Due Date</th>
            <th style="padding:0.6rem; text-align:right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${tasks.map(t => `
            <tr style="border-bottom:1px solid var(--border);" data-id="${t.id}">
              <td style="padding:0.6rem;">
                <select class="status-quick-select" data-id="${t.id}" style="width:auto; padding:0.2rem 0.4rem; font-size:0.75rem;">
                  <option value="PENDING" ${t.status === 'PENDING' ? 'selected' : ''}>Pending</option>
                  <option value="IN_PROGRESS" ${t.status === 'IN_PROGRESS' ? 'selected' : ''}>In Progress</option>
                  <option value="COMPLETED" ${t.status === 'COMPLETED' ? 'selected' : ''}>Completed</option>
                </select>
              </td>
              <td style="padding:0.6rem; font-weight:500; cursor:pointer;" class="open-edit-cell" data-id="${t.id}">
                ${escapeHtml(t.title)}
              </td>
              <td style="padding:0.6rem;"><span class="badge badge-priority-${t.priority}">${t.priority}</span></td>
              <td style="padding:0.6rem;" class="text-xs text-muted">${t.dueDate || '—'}</td>
              <td style="padding:0.6rem; text-align:right;">
                <button class="btn btn-ghost btn-xs edit-task-btn" data-id="${t.id}">Edit</button>
                <button class="btn btn-ghost btn-xs text-danger delete-task-quick" data-id="${t.id}">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    attachCardListeners();
  }

  function attachCardListeners() {
    // Click on card opens modal
    document.querySelectorAll('.task-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.tagName === 'SELECT' || e.target.classList.contains('delete-task-quick')) return;
        openEditModal(card.dataset.id);
      });
    });

    document.querySelectorAll('.open-edit-cell, .edit-task-btn').forEach(el => {
      el.addEventListener('click', () => openEditModal(el.dataset.id));
    });

    // Quick status change
    document.querySelectorAll('.status-quick-select').forEach(sel => {
      sel.addEventListener('change', async () => {
        const id = sel.dataset.id;
        const newStatus = sel.value;
        try {
          await api.patch(`/tasks/${id}/status`, { status: newStatus });
          const t = tasks.find(x => x.id == id);
          if (t) t.status = newStatus;
          render();
          showSuccess('Status updated.');
        } catch (e) {
          showError('Failed to update status: ' + e.message);
          loadTasks();
        }
      });
    });

    // Quick delete
    document.querySelectorAll('.delete-task-quick').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTask(btn.dataset.id);
      });
    });
  }

  // View toggle
  toggleViewBtn.addEventListener('click', () => {
    isKanbanView = !isKanbanView;
    if (isKanbanView) {
      kanbanView.classList.remove('hidden');
      listView.classList.add('hidden');
      toggleViewBtn.textContent = 'Switch to List View';
    } else {
      kanbanView.classList.add('hidden');
      listView.classList.remove('hidden');
      toggleViewBtn.textContent = 'Switch to Kanban View';
    }
    render();
  });

  // Quick Add
  quickAddForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = quickTaskTitle.value.trim();
    if (!title) return;

    setButtonLoading(quickAddBtn, true, 'Adding...');
    try {
      await api.post('/tasks', {
        title,
        priority: quickTaskPriority.value,
        dueDate: quickTaskDate.value || null,
        status: 'PENDING'
      });
      quickTaskTitle.value = '';
      quickTaskDate.value = '';
      showSuccess('Task added.');
      loadTasks();
    } catch (err) {
      showError("Couldn't add task. Please try again.");
    } finally {
      setButtonLoading(quickAddBtn, false, 'Add');
    }
  });

  // Modal logic
  function openCreateModal() {
    taskModalTitle.textContent = 'New Task';
    taskIdField.value = '';
    taskTitle.value = '';
    taskDesc.value = '';
    taskStatus.value = 'PENDING';
    taskPriority.value = 'MEDIUM';
    taskDueDate.value = '';
    deleteTaskBtn.classList.add('hidden');
    taskError.classList.add('hidden');
    modal.classList.add('active');
  }

  function openEditModal(id) {
    const t = tasks.find(x => x.id == id);
    if (!t) return;

    taskModalTitle.textContent = 'Edit Task';
    taskIdField.value = t.id;
    taskTitle.value = t.title;
    taskDesc.value = t.description || '';
    taskStatus.value = t.status;
    taskPriority.value = t.priority;
    taskDueDate.value = t.dueDate || '';
    deleteTaskBtn.classList.remove('hidden');
    deleteTaskBtn.dataset.id = t.id;
    taskError.classList.add('hidden');
    modal.classList.add('active');
  }

  function closeModal() {
    modal.classList.remove('active');
  }

  document.getElementById('open-new-task-btn')?.addEventListener('click', openCreateModal);
  document.getElementById('close-task-modal-btn')?.addEventListener('click', closeModal);
  document.getElementById('cancel-task-btn')?.addEventListener('click', closeModal);

  // Form Submit
  taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = taskIdField.value;
    const isEdit = !!id;

    const payload = {
      title: taskTitle.value.trim(),
      description: taskDesc.value.trim(),
      status: taskStatus.value,
      priority: taskPriority.value,
      dueDate: taskDueDate.value || null
    };

    setButtonLoading(saveTaskBtn, true, 'Saving...');
    taskError.classList.add('hidden');

    try {
      if (isEdit) {
        await api.put(`/tasks/${id}`, payload);
        showSuccess('Task updated successfully.');
      } else {
        await api.post('/tasks', payload);
        showSuccess('Task saved.');
      }
      closeModal();
      loadTasks();
    } catch (err) {
      taskError.textContent = err.message || "Couldn't save task. Please try again.";
      taskError.classList.remove('hidden');
    } finally {
      setButtonLoading(saveTaskBtn, false, 'Save Task');
    }
  });

  // Delete Task
  async function deleteTask(id) {
    const confirmed = await showConfirmDialog(
      'Delete Task?',
      'Are you sure you want to delete this task? It will be safely removed.'
    );
    if (!confirmed) return;

    try {
      await api.delete(`/tasks/${id}`);
      showSuccess('Task deleted.');
      closeModal();
      loadTasks();
    } catch (err) {
      showError(err.message || 'Failed to delete task.');
    }
  }

  deleteTaskBtn?.addEventListener('click', () => {
    deleteTask(deleteTaskBtn.dataset.id);
  });

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  loadTasks();
});
