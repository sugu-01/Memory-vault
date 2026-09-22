/* ============================================================
   Memory Vault — Core API Module (api.js)
   All fetch calls go through here. JWT auth, auto-refresh,
   network-error handling.
   ============================================================ */

const API_BASE = 'http://localhost:8080/api';

/* ── Token helpers ─────────────────────────────────────── */
function getAccessToken()  { return sessionStorage.getItem('accessToken'); }
function getRefreshToken() { return localStorage.getItem('refreshToken'); }

function clearTokens() {
  sessionStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('username');
  localStorage.removeItem('displayName');
}

function storeTokens(data) {
  if (data.accessToken)  sessionStorage.setItem('accessToken',  data.accessToken);
  if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
}

/* ── Refresh token ─────────────────────────────────────── */
let _refreshPromise = null; // Singleton: prevent concurrent refresh calls

async function tryRefreshToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const res = await fetch(API_BASE + '/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      if (!res.ok) return false;
      const json = await res.json();
      const tokenData = json.data || json;
      sessionStorage.setItem('accessToken', tokenData.accessToken);
      if (tokenData.refreshToken) localStorage.setItem('refreshToken', tokenData.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

/* ── Core request function ─────────────────────────────── */
async function apiRequest(method, path, body = null, isRetry = false) {
  const token = getAccessToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body !== null) opts.body = JSON.stringify(body);

  let response;
  try {
    response = await fetch(API_BASE + path, opts);
  } catch (networkErr) {
    throw new Error('Network error: Could not reach the server. Please check your connection.');
  }

  /* ── Handle 401 — try refresh once ── */
  if (response.status === 401 && !isRetry) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      return apiRequest(method, path, body, true); // Retry with new token
    } else {
      clearTokens();
      window.location.href = '/index.html';
      throw new Error('Session expired. Please log in again.');
    }
  }

  /* ── Handle non-OK responses ── */
  if (!response.ok) {
    let errMsg = `Server error: ${response.status}`;
    try {
      const errJson = await response.json();
      errMsg = errJson.message || errJson.error || errMsg;
    } catch { /* body wasn't JSON */ }
    throw new Error(errMsg);
  }

  /* ── Parse response ── */
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/* ── Public API object ─────────────────────────────────── */
const api = {
  get:    (path)        => apiRequest('GET',    path),
  post:   (path, body)  => apiRequest('POST',   path, body),
  put:    (path, body)  => apiRequest('PUT',    path, body),
  patch:  (path, body)  => apiRequest('PATCH',  path, body),
  delete: (path)        => apiRequest('DELETE', path),
};

/* ── Toast notification system ─────────────────────────── */
function ensureToastContainer() {
  let c = document.getElementById('toast-container');
  if (!c) {
    c = document.createElement('div');
    c.id = 'toast-container';
    c.className = 'toast-container';
    document.body.appendChild(c);
  }
  return c;
}

function showToast(msg, type = 'info') {
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const container = ensureToastContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
  container.appendChild(toast);

  // Auto-remove after 4s
  setTimeout(() => {
    toast.style.animation = 'none';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(24px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function showSuccess(msg) { showToast(msg, 'success'); }
function showError(msg)   { showToast(msg, 'error'); }
function showInfo(msg)    { showToast(msg, 'info'); }
function showWarning(msg) { showToast(msg, 'warning'); }

/* ── Confirm dialog ────────────────────────────────────── */
function showConfirmDialog(title, message) {
  return new Promise(resolve => {
    // Ensure modal exists
    let modal = document.getElementById('confirm-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'confirm-modal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal" style="max-width:420px">
          <div class="modal-header">
            <h3 class="modal-title" id="confirm-title">Confirm</h3>
          </div>
          <div class="modal-body">
            <p id="confirm-message"></p>
          </div>
          <div class="modal-footer">
            <button id="confirm-no"  class="btn btn-secondary">Cancel</button>
            <button id="confirm-yes" class="btn btn-danger">Confirm</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
    }

    document.getElementById('confirm-title').textContent   = title;
    document.getElementById('confirm-message').textContent = message;
    modal.classList.add('active');

    const cleanup = () => modal.classList.remove('active');
    document.getElementById('confirm-yes').onclick = () => { cleanup(); resolve(true); };
    document.getElementById('confirm-no').onclick  = () => { cleanup(); resolve(false); };
    modal.onclick = e => { if (e.target === modal) { cleanup(); resolve(false); } };
  });
}

/* ── Button loading helper ─────────────────────────────── */
function setButtonLoading(btn, loading, originalText) {
  if (loading) {
    btn.dataset.origText = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span> ${originalText || 'Loading...'}`;
    btn.disabled = true;
  } else {
    btn.innerHTML = btn.dataset.origText || originalText || btn.innerHTML;
    btn.disabled = false;
  }
}

/* ── Auth guard ────────────────────────────────────────── */
function requireAuth() {
  if (!getAccessToken()) {
    window.location.href = '/index.html';
    return false;
  }
  return true;
}

function redirectIfAuthed() {
  if (getAccessToken()) {
    window.location.href = '/dashboard.html';
  }
}

/* ── Expose globals ────────────────────────────────────── */
window.api             = api;
window.clearTokens     = clearTokens;
window.storeTokens     = storeTokens;
window.showToast       = showToast;
window.showSuccess     = showSuccess;
window.showError       = showError;
window.showInfo        = showInfo;
window.showWarning     = showWarning;
window.showConfirmDialog = showConfirmDialog;
window.setButtonLoading  = setButtonLoading;
window.requireAuth       = requireAuth;
window.redirectIfAuthed  = redirectIfAuthed;
window.getAccessToken    = getAccessToken;
window.getRefreshToken   = getRefreshToken;
