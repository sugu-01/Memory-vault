/* ============================================================
   Memory Vault — Auth Module (auth.js)
   Login, register, token management.
   ============================================================ */

// Redirect if already logged in
redirectIfAuthed();

/* ── Tab switching ─────────────────────────────────────── */
const tabBtns = document.querySelectorAll('.auth-tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${target}`)?.classList.add('active');
  });
});

/* ── Field validation helpers ──────────────────────────── */
function showFieldError(fieldId, msg) {
  const el = document.getElementById(fieldId);
  if (el) { el.textContent = msg; el.classList.remove('hidden'); }
}

function clearFieldError(fieldId) {
  const el = document.getElementById(fieldId);
  if (el) { el.textContent = ''; el.classList.add('hidden'); }
}

function clearAllErrors(prefix) {
  ['username', 'password', 'displayname', 'email', 'confirm'].forEach(f => clearFieldError(`${prefix}-${f}-err`));
  const formErr = document.getElementById(`${prefix}-error`);
  if (formErr) { formErr.textContent = ''; formErr.classList.add('hidden'); }
}

function showFormError(errorElId, msg) {
  const el = document.getElementById(errorElId);
  if (el) { el.textContent = msg; el.classList.remove('hidden'); }
}

/* ── Login ─────────────────────────────────────────────── */
document.getElementById('login-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  clearAllErrors('login');

  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  let valid = true;

  if (!username) { showFieldError('login-username-err', 'Username is required.'); valid = false; }
  if (!password) { showFieldError('login-password-err', 'Password is required.'); valid = false; }
  if (!valid) return;

  const btn = document.getElementById('login-btn');
  setButtonLoading(btn, true, 'Signing in...');

  try {
    const res = await api.post('/auth/login', { username, password });
    const data = res.data || res;
    storeTokens(data);
    if (data.userId)      localStorage.setItem('userId', data.userId);
    if (data.username)    localStorage.setItem('username', data.username);
    if (data.displayName) localStorage.setItem('displayName', data.displayName);
    showSuccess('Welcome back!');
    setTimeout(() => { window.location.href = '/dashboard.html'; }, 500);
  } catch (err) {
    setButtonLoading(btn, false, 'Sign In');
    showFormError('login-error', err.message || 'Invalid credentials. Please try again.');
  }
});

/* ── Register ──────────────────────────────────────────── */
document.getElementById('register-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  clearAllErrors('reg');

  const username    = document.getElementById('reg-username').value.trim();
  const displayName = document.getElementById('reg-displayname').value.trim();
  const email       = document.getElementById('reg-email').value.trim();
  const password    = document.getElementById('reg-password').value;
  const confirm     = document.getElementById('reg-confirm').value;
  let valid = true;

  if (!username || username.length < 3) {
    showFieldError('reg-username-err', 'Username must be at least 3 characters.'); valid = false;
  }
  if (!displayName) {
    showFieldError('reg-displayname-err', 'Display name is required.'); valid = false;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showFieldError('reg-email-err', 'Enter a valid email address.'); valid = false;
  }
  if (!password || password.length < 8) {
    showFieldError('reg-password-err', 'Password must be at least 8 characters.'); valid = false;
  }
  if (password !== confirm) {
    showFieldError('reg-confirm-err', 'Passwords do not match.'); valid = false;
  }
  if (!valid) return;

  const btn = document.getElementById('register-btn');
  setButtonLoading(btn, true, 'Creating account...');

  try {
    const res = await api.post('/auth/register', { username, displayName, email, password });
    const data = res.data || res;
    storeTokens(data);
    if (data.userId)      localStorage.setItem('userId', data.userId);
    if (data.username)    localStorage.setItem('username', data.username);
    if (data.displayName) localStorage.setItem('displayName', data.displayName);
    showSuccess('Account created! Welcome to Memory Vault 🎉');
    setTimeout(() => { window.location.href = '/dashboard.html'; }, 700);
  } catch (err) {
    setButtonLoading(btn, false, 'Create Account');
    showFormError('register-error', err.message || 'Registration failed. Please try again.');
  }
});

/* ── Auto-focus first field ────────────────────────────── */
document.getElementById('login-username')?.focus();
