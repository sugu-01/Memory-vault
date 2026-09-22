/* ============================================================
   Memory Vault — Search Script (search.js)
   Universal search across memories, tasks, and goals.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  initNav('Search');

  const searchInput = document.getElementById('global-search-input');
  const searchStatus = document.getElementById('search-status');
  const searchResults = document.getElementById('search-results');

  let debounceTimer;

  // Check URL params for query if navigated from elsewhere
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q');
  if (initialQuery) {
    searchInput.value = initialQuery;
    performSearch(initialQuery);
  }

  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = searchInput.value.trim();
    if (!q) {
      searchStatus.textContent = '';
      searchResults.innerHTML = '';
      return;
    }
    searchStatus.innerHTML = `<span class="spinner"></span> Searching...`;
    debounceTimer = setTimeout(() => performSearch(q), 300);
  });

  async function performSearch(query) {
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
      const data = res?.data || {};

      const memories = data.memories || [];
      const tasks = data.tasks || [];
      const goals = data.goals || [];
      const total = memories.length + tasks.length + goals.length;

      if (total === 0) {
        searchStatus.textContent = `No results found for "${query}"`;
        searchResults.innerHTML = '';
        return;
      }

      searchStatus.textContent = `Found ${total} result${total === 1 ? '' : 's'} for "${query}"`;

      let html = '';

      if (memories.length > 0) {
        html += `
          <div class="result-section">
            <h3 class="section-title">📖 Memories (${memories.length})</h3>
            ${memories.map(m => `
              <div class="result-card" onclick="window.location.href='/diary.html'">
                <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem;">
                  <strong>${escapeHtml(m.title || 'Untitled Memory')}</strong>
                  <span class="text-xs text-muted">${m.memoryDate}</span>
                </div>
                <p class="text-xs text-secondary">${escapeHtml(m.originalContent.slice(0, 160))}${m.originalContent.length > 160 ? '...' : ''}</p>
              </div>
            `).join('')}
          </div>
        `;
      }

      if (tasks.length > 0) {
        html += `
          <div class="result-section">
            <h3 class="section-title">✅ Tasks (${tasks.length})</h3>
            ${tasks.map(t => `
              <div class="result-card" onclick="window.location.href='/tasks.html'">
                <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem;">
                  <strong>${escapeHtml(t.title)}</strong>
                  <span class="badge badge-priority-${t.priority}">${t.priority}</span>
                </div>
                ${t.description ? `<p class="text-xs text-secondary">${escapeHtml(t.description.slice(0, 140))}</p>` : ''}
              </div>
            `).join('')}
          </div>
        `;
      }

      if (goals.length > 0) {
        html += `
          <div class="result-section">
            <h3 class="section-title">🎯 Goals (${goals.length})</h3>
            ${goals.map(g => `
              <div class="result-card" onclick="window.location.href='/goals.html'">
                <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem;">
                  <strong>${escapeHtml(g.title)}</strong>
                  <span class="badge badge-info">${g.progress}% Completed</span>
                </div>
                ${g.description ? `<p class="text-xs text-secondary">${escapeHtml(g.description.slice(0, 140))}</p>` : ''}
              </div>
            `).join('')}
          </div>
        `;
      }

      searchResults.innerHTML = html;
    } catch (e) {
      searchStatus.textContent = 'Search failed: ' + e.message;
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
});
