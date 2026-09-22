/* ============================================================
   Memory Vault — My Memory Script (diary.js)
   Unified diary, notes, important items, timeline, and search.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  initNav('My Memory');

  let currentTab = 'today';
  let currentPage = 0;
  let searchQuery = '';
  let availableTags = [];
  let selectedTagIds = new Set();
  let selectedMood = 'NEUTRAL';

  // DOM Elements
  const container = document.getElementById('memories-container');
  const paginationControls = document.getElementById('pagination-controls');
  const tabs = document.querySelectorAll('.tab-btn');
  const searchBarContainer = document.getElementById('search-bar-container');
  const searchInput = document.getElementById('memory-search-input');

  const modal = document.getElementById('memory-modal');
  const modalTitle = document.getElementById('memory-modal-title');
  const form = document.getElementById('memory-form');
  const entryId = document.getElementById('entry-id');
  const entryTitle = document.getElementById('entry-title');
  const entryDate = document.getElementById('entry-date');
  const entryContent = document.getElementById('entry-content');
  const entryImportant = document.getElementById('entry-important');
  const tagPicker = document.getElementById('tag-picker');
  const moodBtns = document.querySelectorAll('.mood-btn');
  const saveBtn = document.getElementById('save-entry-btn');
  const modalError = document.getElementById('modal-error-msg');

  // Today's date default
  const todayStr = new Date().toISOString().split('T')[0];
  entryDate.value = todayStr;

  // Mood handling
  moodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      moodBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedMood = btn.dataset.mood;
    });
  });

  function setMood(mood) {
    selectedMood = mood || 'NEUTRAL';
    moodBtns.forEach(b => {
      b.classList.toggle('selected', b.dataset.mood === selectedMood);
    });
  }

  // Load Tags
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
        #${escapeHtml(tag.name)}
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

  // Load Memories based on current tab
  async function loadMemories(page = 0) {
    currentPage = page;
    container.innerHTML = `
      <div class="card skeleton" style="height: 110px; margin-bottom: 1rem;"></div>
      <div class="card skeleton" style="height: 110px;"></div>
    `;

    try {
      let memories = [];
      let totalPages = 1;

      if (currentTab === 'today') {
        const res = await api.get('/daily-summary');
        memories = res?.data?.memoriesToday || [];
      } else if (currentTab === 'important') {
        const res = await api.get(`/memories?page=${page}&size=10&isImportant=true`);
        memories = res?.data?.content || [];
        totalPages = res?.data?.totalPages || 1;
      } else if (currentTab === 'upcoming') {
        // Fetch memories with upcoming dates or reminders
        const res = await api.get('/daily-summary');
        const upcomingReminders = res?.data?.upcomingReminders || [];
        const resMem = await api.get(`/memories?page=0&size=15`);
        const allMem = resMem?.data?.content || [];
        // Match memories linked to upcoming reminders or marked important
        memories = allMem.filter(m => m.isImportant || upcomingReminders.some(r => r.taskId === m.id));
      } else if (currentTab === 'search') {
        if (!searchQuery.trim()) {
          container.innerHTML = `<p class="text-muted text-center" style="padding:2rem;">Type in the search box above to search your memories.</p>`;
          paginationControls.innerHTML = '';
          return;
        }
        const res = await api.get(`/memories/search?q=${encodeURIComponent(searchQuery.trim())}&page=${page}&size=10`);
        memories = res?.data?.content || [];
        totalPages = res?.data?.totalPages || 1;
      } else {
        // 'all' timeline
        const res = await api.get(`/memories?page=${page}&size=10`);
        memories = res?.data?.content || [];
        totalPages = res?.data?.totalPages || 1;
      }

      renderMemories(memories);
      if (currentTab === 'all' || currentTab === 'search' || currentTab === 'important') {
        renderPagination(currentPage, totalPages);
      } else {
        paginationControls.innerHTML = '';
      }
    } catch (err) {
      container.innerHTML = `
        <div class="card text-center" style="padding:2rem;">
          <p class="text-danger" style="margin-bottom:0.75rem;">⚠️ Could not load memories: ${escapeHtml(err.message)}</p>
          <button class="btn btn-secondary btn-sm" id="retry-load-btn">Retry</button>
        </div>
      `;
      document.getElementById('retry-load-btn')?.addEventListener('click', () => loadMemories(currentPage));
    }
  }

  function renderMemories(memories) {
    if (!memories || memories.length === 0) {
      let emptyMsg = 'No memories found for this view.';
      if (currentTab === 'today') emptyMsg = 'Nothing recorded yet today. Take a moment to write a thought.';
      if (currentTab === 'important') emptyMsg = 'No memories marked as important yet.';

      container.innerHTML = `
        <div class="card text-center" style="padding: 2.5rem 1rem;">
          <p class="text-muted" style="margin-bottom:1rem;">${emptyMsg}</p>
          <button class="btn btn-primary btn-sm" id="empty-add-btn">+ Write a Memory</button>
        </div>
      `;
      document.getElementById('empty-add-btn')?.addEventListener('click', openCreateModal);
      return;
    }

    const moodIcons = {
      HAPPY: '😊', EXCITED: '🤩', CALM: '😌', NEUTRAL: '😐', TIRED: '🥱', SAD: '😢'
    };

    container.innerHTML = memories.map(m => {
      const mood = moodIcons[m.mood] || '📝';
      const formattedDate = new Date(m.memoryDate).toLocaleDateString(undefined, {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
      });
      const tagsHTML = (m.tags || []).map(t => `<span class="badge badge-neutral">#${escapeHtml(t.name)}</span>`).join(' ');

      return `
        <article class="memory-card" id="mem-${m.id}">
          <div class="memory-header">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-size:1.15rem;">${mood}</span>
              <h3 style="font-size:1.05rem; font-weight:600;">${escapeHtml(m.title || 'Untitled Memory')}</h3>
              <span class="text-xs text-muted" style="margin-left:0.25rem;">${formattedDate}</span>
            </div>
            <div style="display:flex; align-items:center; gap:0.45rem;">
              <button class="star-btn${m.isImportant ? ' starred' : ''}" data-id="${m.id}" title="Toggle Important">
                ${m.isImportant ? '★' : '☆'}
              </button>
              <button class="btn btn-ghost btn-sm edit-btn" data-id="${m.id}">Edit</button>
              <button class="btn btn-ghost btn-sm text-danger delete-btn" data-id="${m.id}">Delete</button>
            </div>
          </div>

          <div style="white-space:pre-wrap; color:var(--text-secondary); margin-bottom:0.75rem; font-size:0.925rem; line-height:1.55;">
            ${escapeHtml(m.originalContent)}
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
              ${tagsHTML}
            </div>
            <button class="btn btn-ghost btn-xs ai-trigger-btn" data-id="${m.id}">✨ AI Analysis</button>
          </div>

          <div id="ai-box-${m.id}" class="hidden" style="margin-top:0.75rem;"></div>
        </article>
      `;
    }).join('');

    // Attach listeners
    container.querySelectorAll('.edit-btn').forEach(b => {
      b.addEventListener('click', () => openEditModal(b.dataset.id));
    });

    container.querySelectorAll('.delete-btn').forEach(b => {
      b.addEventListener('click', () => deleteMemory(b.dataset.id));
    });

    container.querySelectorAll('.star-btn').forEach(b => {
      b.addEventListener('click', () => toggleStar(b.dataset.id, b));
    });

    container.querySelectorAll('.ai-trigger-btn').forEach(b => {
      b.addEventListener('click', () => toggleAiInsights(b.dataset.id));
    });
  }

  function renderPagination(current, total) {
    if (total <= 1) {
      paginationControls.innerHTML = '';
      return;
    }
    paginationControls.innerHTML = `
      ${current > 0 ? `<button class="btn btn-secondary btn-sm" id="prev-page-btn">← Previous</button>` : ''}
      <span class="text-xs text-muted" style="align-self:center;">Page ${current + 1} of ${total}</span>
      ${current < total - 1 ? `<button class="btn btn-secondary btn-sm" id="next-page-btn">Next →</button>` : ''}
    `;
    document.getElementById('prev-page-btn')?.addEventListener('click', () => loadMemories(current - 1));
    document.getElementById('next-page-btn')?.addEventListener('click', () => loadMemories(current + 1));
  }

  // AI Insights Toggle
  async function toggleAiInsights(id) {
    const box = document.getElementById(`ai-box-${id}`);
    if (!box) return;
    if (!box.classList.contains('hidden')) {
      box.classList.add('hidden');
      return;
    }

    box.classList.remove('hidden');
    box.innerHTML = `<span class="text-xs text-muted"><span class="spinner"></span> Checking insights...</span>`;

    try {
      const res = await api.get(`/ai/extraction/${id}`);
      const ext = res?.data;
      if (!ext) {
        box.innerHTML = `
          <div class="ai-insights-box">
            <span class="text-muted text-xs">No analysis generated yet.</span>
            <button class="btn btn-ghost btn-xs run-ai-btn" style="margin-left:0.5rem;" data-id="${id}">Run Now</button>
          </div>
        `;
        box.querySelector('.run-ai-btn')?.addEventListener('click', async () => {
          await api.post(`/ai/analyze/${id}`);
          showInfo('Analysis scheduled.');
          setTimeout(() => toggleAiInsights(id), 2000);
        });
        return;
      }

      box.innerHTML = `
        <div class="ai-insights-box">
          <div style="font-weight:600; margin-bottom:0.35rem;">✨ Reflection Insights:</div>
          ${ext.importantPoints ? `<p><strong>Key Points:</strong> ${escapeHtml(ext.importantPoints)}</p>` : ''}
          ${ext.extractedTasks ? `<p><strong>Tasks Mentioned:</strong> ${escapeHtml(ext.extractedTasks)}</p>` : ''}
          ${ext.extractedReminders ? `<p><strong>Reminders:</strong> ${escapeHtml(ext.extractedReminders)}</p>` : ''}
          ${ext.keywords ? `<p class="text-xs text-muted" style="margin-top:0.3rem;">Tags: ${escapeHtml(ext.keywords)}</p>` : ''}
        </div>
      `;
    } catch {
      box.innerHTML = `<span class="text-xs text-muted">Analysis unavailable.</span>`;
    }
  }

  // Tabs handling
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.tab;

      if (currentTab === 'search') {
        searchBarContainer.classList.remove('hidden');
        searchInput.focus();
      } else {
        searchBarContainer.classList.add('hidden');
      }

      loadMemories(0);
    });
  });

  // Search input debounce
  let searchTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchQuery = searchInput.value;
      loadMemories(0);
    }, 300);
  });

  // Modal Open/Close
  function openCreateModal() {
    modalTitle.textContent = 'Write Memory';
    entryId.value = '';
    entryTitle.value = '';
    entryDate.value = todayStr;
    entryContent.value = '';
    entryImportant.checked = false;
    selectedTagIds.clear();
    renderTagPicker();
    setMood('NEUTRAL');
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

      entryId.value = m.id;
      entryTitle.value = m.title || '';
      entryDate.value = m.memoryDate;
      entryContent.value = m.originalContent;
      entryImportant.checked = !!m.isImportant;
      setMood(m.mood);

      selectedTagIds = new Set((m.tags || []).map(t => t.id));
      renderTagPicker();
      modal.classList.add('active');
    } catch (e) {
      showError('Unable to open memory: ' + e.message);
    }
  }

  function closeModal() {
    modal.classList.remove('active');
  }

  document.getElementById('open-memory-modal-btn')?.addEventListener('click', openCreateModal);
  document.getElementById('close-memory-modal-btn')?.addEventListener('click', closeModal);
  document.getElementById('cancel-memory-modal-btn')?.addEventListener('click', closeModal);

  // Form Submit: Strict Data Safety
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = entryId.value;
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
      modalError.textContent = 'Memory content cannot be empty.';
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
        showSuccess('Memory safely recorded.');
      }
      closeModal();
      loadMemories(currentPage);
    } catch (err) {
      // DATA SAFETY: Keep user's text intact inside the textarea!
      const msg = isEdit
        ? "Unable to save changes. Your previous version is still safe."
        : "Couldn't save your entry. Please try again. Your writing is kept safe.";
      modalError.textContent = msg;
      modalError.classList.remove('hidden');
      showError(msg);
    } finally {
      setButtonLoading(saveBtn, false, 'Save Memory');
    }
  });

  // Soft-Delete with confirmation
  async function deleteMemory(id) {
    const confirmed = await showConfirmDialog(
      'Delete Memory?',
      'Are you sure you want to delete this memory? It will be safely soft-deleted.'
    );
    if (!confirmed) return;

    try {
      await api.delete(`/memories/${id}`);
      showSuccess('Memory removed.');
      loadMemories(currentPage);
    } catch (e) {
      showError('Failed to delete: ' + e.message);
    }
  }

  // Toggle Star
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
      showSuccess(m.isImportant ? 'Marked as Important ⭐' : 'Unmarked from Important');
    } catch (e) {
      showError('Could not update status: ' + e.message);
    }
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  loadTags();
  loadMemories();
});
