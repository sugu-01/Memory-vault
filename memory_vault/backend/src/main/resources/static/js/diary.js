/* ============================================================
   Memory Vault — Diary & Memories Script (diary.js)
   Safeguards user content, handles retry, edit, soft-delete.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  initNav('Diary');

  let currentPage = 0;
  let currentFilter = 'all'; // 'all' or 'important'
  let searchQuery = '';
  let availableTags = [];
  let selectedTagIds = new Set();
  let selectedMood = 'NEUTRAL';

  // Elements
  const container = document.getElementById('memories-container');
  const paginationControls = document.getElementById('pagination-controls');
  const modal = document.getElementById('entry-modal');
  const modalTitle = document.getElementById('modal-title');
  const entryForm = document.getElementById('entry-form');
  const entryIdField = document.getElementById('entry-id');
  const entryTitle = document.getElementById('entry-title');
  const entryDate = document.getElementById('entry-date');
  const entryContent = document.getElementById('entry-content');
  const entryImportant = document.getElementById('entry-important');
  const tagPicker = document.getElementById('tag-picker');
  const moodButtons = document.querySelectorAll('.mood-btn');
  const saveBtn = document.getElementById('save-entry-btn');
  const modalError = document.getElementById('modal-error-msg');
  const saveAlert = document.getElementById('save-alert');
  const searchInput = document.getElementById('diary-search-input');
  const filterTabs = document.querySelectorAll('.filter-tab');

  // Set default date to today
  entryDate.value = new Date().toISOString().split('T')[0];

  // Mood selection
  moodButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      moodButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedMood = btn.dataset.mood;
    });
  });

  function setSelectedMood(mood) {
    selectedMood = mood || 'NEUTRAL';
    moodButtons.forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.mood === selectedMood);
    });
  }

  // Load tags
  async function loadTags() {
    try {
      const res = await api.get('/tags');
      availableTags = res?.data || [];
      renderTagPicker();
    } catch (e) {
      console.warn('Could not load tags:', e.message);
    }
  }

  function renderTagPicker() {
    tagPicker.innerHTML = availableTags.map(tag => {
      const isSelected = selectedTagIds.has(tag.id);
      return `<span class="tag-chip${isSelected ? ' selected' : ''}" data-id="${tag.id}">
        #${tag.name}
      </span>`;
    }).join('');

    tagPicker.querySelectorAll('.tag-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const id = Number(chip.dataset.id);
        if (selectedTagIds.has(id)) {
          selectedTagIds.delete(id);
          chip.classList.remove('selected');
        } else {
          selectedTagIds.add(id);
          chip.classList.add('selected');
        }
      });
    });
  }

  // Load Memories
  async function loadMemories(page = 0) {
    currentPage = page;
    container.innerHTML = `
      <div class="card skeleton" style="height: 120px; margin-bottom: 1rem;"></div>
      <div class="card skeleton" style="height: 120px; margin-bottom: 1rem;"></div>
    `;

    try {
      let url = `/memories?page=${page}&size=10`;
      if (currentFilter === 'important') url += '&isImportant=true';
      if (searchQuery.trim()) {
        url = `/memories/search?q=${encodeURIComponent(searchQuery.trim())}&page=${page}&size=10`;
      }

      const res = await api.get(url);
      const data = res?.data;
      renderMemories(data?.content || []);
      renderPagination(data?.page || 0, data?.totalPages || 0);
    } catch (err) {
      container.innerHTML = `
        <div class="card text-center" style="padding:2rem;">
          <p class="text-danger" style="margin-bottom:1rem;">⚠️ ${err.message || 'Failed to load entries.'}</p>
          <button class="btn btn-secondary btn-sm" id="retry-load-btn">Retry</button>
        </div>
      `;
      document.getElementById('retry-load-btn')?.addEventListener('click', () => loadMemories(currentPage));
    }
  }

  function renderMemories(memories) {
    if (!memories || memories.length === 0) {
      container.innerHTML = `
        <div class="card text-center" style="padding: 3rem 1rem;">
          <p class="text-muted" style="font-size:1.1rem; margin-bottom:1rem;">No memories found.</p>
          <button class="btn btn-primary" id="empty-write-btn">+ Write your first memory</button>
        </div>
      `;
      document.getElementById('empty-write-btn')?.addEventListener('click', openCreateModal);
      return;
    }

    const moodIcons = {
      HAPPY: '😊', EXCITED: '🤩', CALM: '😌', NEUTRAL: '😐', TIRED: '🥱', SAD: '😢'
    };

    container.innerHTML = memories.map(m => {
      const moodIcon = moodIcons[m.mood] || '📝';
      const tagsHTML = (m.tags || []).map(t => `<span class="tag-badge">#${t.name}</span>`).join(' ');
      const formattedDate = new Date(m.memoryDate).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
      });

      return `
        <div class="memory-card" id="memory-${m.id}">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem;">
            <div>
              <span style="font-size:1.1rem; margin-right:0.35rem;">${moodIcon}</span>
              <strong style="font-size:1.05rem;">${m.title || 'Untitled Entry'}</strong>
              <span class="text-xs text-muted" style="margin-left:0.5rem;">${formattedDate}</span>
            </div>
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <button class="star-btn${m.isImportant ? ' starred' : ''}" data-id="${m.id}" title="${m.isImportant ? 'Starred' : 'Star memory'}">
                ${m.isImportant ? '★' : '☆'}
              </button>
              <button class="btn btn-ghost btn-sm edit-entry-btn" data-id="${m.id}">Edit</button>
              <button class="btn btn-ghost btn-sm text-danger delete-entry-btn" data-id="${m.id}">Delete</button>
            </div>
          </div>

          <div style="white-space:pre-wrap; color:var(--text-secondary); margin-bottom:0.75rem; font-size:0.95rem;">
            ${escapeHtml(m.originalContent)}
          </div>

          ${tagsHTML ? `<div style="margin-bottom:0.5rem;">${tagsHTML}</div>` : ''}

          <!-- Expandable AI Insights Area -->
          <div id="ai-box-${m.id}" class="ai-insights-container">
            <button class="btn btn-ghost btn-xs load-ai-btn" data-id="${m.id}">✨ View AI Insights</button>
          </div>
        </div>
      `;
    }).join('');

    // Attach card action listeners
    container.querySelectorAll('.edit-entry-btn').forEach(b => {
      b.addEventListener('click', () => openEditModal(b.dataset.id));
    });

    container.querySelectorAll('.delete-entry-btn').forEach(b => {
      b.addEventListener('click', () => deleteEntry(b.dataset.id));
    });

    container.querySelectorAll('.star-btn').forEach(b => {
      b.addEventListener('click', () => toggleStar(b.dataset.id, b));
    });

    container.querySelectorAll('.load-ai-btn').forEach(b => {
      b.addEventListener('click', () => loadAiInsights(b.dataset.id));
    });
  }

  function renderPagination(current, total) {
    if (total <= 1) {
      paginationControls.innerHTML = '';
      return;
    }
    let html = '';
    if (current > 0) {
      html += `<button class="btn btn-secondary btn-sm" id="prev-page-btn">← Previous</button>`;
    }
    html += `<span class="text-xs text-muted" style="align-self:center;">Page ${current + 1} of ${total}</span>`;
    if (current < total - 1) {
      html += `<button class="btn btn-secondary btn-sm" id="next-page-btn">Next →</button>`;
    }
    paginationControls.innerHTML = html;

    document.getElementById('prev-page-btn')?.addEventListener('click', () => loadMemories(current - 1));
    document.getElementById('next-page-btn')?.addEventListener('click', () => loadMemories(current + 1));
  }

  // AI Insights
  async function loadAiInsights(memoryId) {
    const box = document.getElementById(`ai-box-${memoryId}`);
    if (!box) return;
    box.innerHTML = `<span class="text-xs text-muted"><span class="spinner"></span> Loading AI analysis...</span>`;

    try {
      const res = await api.get(`/ai/extraction/${memoryId}`);
      const ext = res?.data;
      if (!ext) {
        box.innerHTML = `
          <div class="ai-insights-box">
            <p class="text-muted">No AI insights generated yet.</p>
            <button class="btn btn-ghost btn-xs trigger-ai-btn" style="margin-top:0.3rem;" data-id="${memoryId}">⚡ Run Analysis</button>
          </div>
        `;
        box.querySelector('.trigger-ai-btn')?.addEventListener('click', () => triggerAiAnalysis(memoryId));
        return;
      }

      box.innerHTML = `
        <div class="ai-insights-box">
          <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem;">
            <strong>✨ AI Analysis</strong>
            <span class="badge ${ext.sentiment === 'POSITIVE' ? 'badge-success' : 'badge-neutral'}">${ext.sentiment || 'ANALYZED'}</span>
          </div>
          ${ext.importantPoints ? `<p><strong>Important:</strong> ${escapeHtml(ext.importantPoints)}</p>` : ''}
          ${ext.extractedTasks ? `<p><strong>Tasks Mentioned:</strong> ${escapeHtml(ext.extractedTasks)}</p>` : ''}
          ${ext.extractedReminders ? `<p><strong>Reminders:</strong> ${escapeHtml(ext.extractedReminders)}</p>` : ''}
          ${ext.keywords ? `<p class="text-xs text-muted" style="margin-top:0.3rem;"><strong>Keywords:</strong> ${escapeHtml(ext.keywords)}</p>` : ''}
        </div>
      `;
    } catch {
      box.innerHTML = `<span class="text-xs text-muted">AI insights unavailable.</span>`;
    }
  }

  async function triggerAiAnalysis(memoryId) {
    try {
      showInfo('AI analysis requested...');
      await api.post(`/ai/analyze/${memoryId}`);
      setTimeout(() => loadAiInsights(memoryId), 2000);
    } catch (e) {
      showError(e.message || 'Could not run AI analysis.');
    }
  }

  // Modal Open/Close
  function openCreateModal() {
    modalTitle.textContent = 'Write New Memory';
    entryIdField.value = '';
    entryTitle.value = '';
    entryDate.value = new Date().toISOString().split('T')[0];
    entryContent.value = '';
    entryImportant.checked = false;
    selectedTagIds.clear();
    renderTagPicker();
    setSelectedMood('NEUTRAL');
    modalError.classList.add('hidden');
    modal.classList.add('active');
  }

  async function openEditModal(id) {
    modalTitle.textContent = 'Edit Memory';
    modalError.classList.add('hidden');
    try {
      const res = await api.get(`/memories/${id}`);
      const m = res?.data;
      if (!m) return;

      entryIdField.value = m.id;
      entryTitle.value = m.title || '';
      entryDate.value = m.memoryDate;
      entryContent.value = m.originalContent;
      entryImportant.checked = !!m.isImportant;
      setSelectedMood(m.mood);

      selectedTagIds = new Set((m.tags || []).map(t => t.id));
      renderTagPicker();
      modal.classList.add('active');
    } catch (e) {
      showError('Unable to open entry for editing: ' + e.message);
    }
  }

  function closeModal() {
    modal.classList.remove('active');
    modalError.classList.add('hidden');
  }

  document.getElementById('open-new-entry-btn')?.addEventListener('click', openCreateModal);
  document.getElementById('close-modal-btn')?.addEventListener('click', closeModal);
  document.getElementById('cancel-modal-btn')?.addEventListener('click', closeModal);

  // Form Submit: Safe saving
  entryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = entryIdField.value;
    const isEdit = !!id;

    const payload = {
      title: entryTitle.value.trim(),
      originalContent: entryContent.value.trim(),
      memoryDate: entryDate.value,
      mood: selectedMood,
      isImportant: entryImportant.checked,
      tagIds: Array.from(selectedTagIds)
    };

    if (!payload.originalContent) {
      modalError.textContent = 'Entry content cannot be empty.';
      modalError.classList.remove('hidden');
      return;
    }

    setButtonLoading(saveBtn, true, 'Saving...');
    modalError.classList.add('hidden');

    try {
      if (isEdit) {
        await api.put(`/memories/${id}`, payload);
        showSuccess('Saved successfully! Previous version safely updated.');
      } else {
        await api.post('/memories', payload);
        showSuccess('Saved successfully! Your memory is permanently recorded.');
      }
      closeModal();
      loadMemories(currentPage);
    } catch (err) {
      // DATA SAFETY: Keep the user's typed text intact in the form!
      if (isEdit) {
        modalError.textContent = "Unable to save changes. Your previous version is still safe.";
      } else {
        modalError.textContent = "Couldn't save your entry. Please try again. Your writing is kept safe.";
      }
      modalError.classList.remove('hidden');
      showError(isEdit ? "Unable to save changes. Your previous version is still safe." : "Couldn't save your entry. Please try again.");
    } finally {
      setButtonLoading(saveBtn, false, 'Save Entry');
    }
  });

  // Soft-delete with Confirmation
  async function deleteEntry(id) {
    const confirmed = await showConfirmDialog(
      'Delete this entry?',
      'Are you sure you want to delete this memory? It will be safely soft-deleted.'
    );
    if (!confirmed) return;

    try {
      await api.delete(`/memories/${id}`);
      showSuccess('Entry removed.');
      loadMemories(currentPage);
    } catch (err) {
      showError(err.message || 'Failed to delete entry.');
    }
  }

  // Toggle Important Star
  async function toggleStar(id, btn) {
    try {
      const res = await api.get(`/memories/${id}`);
      const m = res?.data;
      if (!m) return;

      m.isImportant = !m.isImportant;
      await api.put(`/memories/${id}`, {
        title: m.title,
        originalContent: m.originalContent,
        memoryDate: m.memoryDate,
        mood: m.mood,
        isImportant: m.isImportant,
        tagIds: (m.tags || []).map(t => t.id)
      });

      btn.classList.toggle('starred', m.isImportant);
      btn.textContent = m.isImportant ? '★' : '☆';
      showSuccess(m.isImportant ? 'Marked as Important' : 'Unmarked from Important');
    } catch (e) {
      showError('Could not update status: ' + e.message);
    }
  }

  // Filter tabs
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      loadMemories(0);
    });
  });

  // Search debounce
  let searchTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchQuery = searchInput.value;
      loadMemories(0);
    }, 350);
  });

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Initial load
  loadTags();
  loadMemories();
});
