/* ============================================================
   Memory Vault — Settings & Backup Script (settings.js)
   Profile, password change, and authenticated data exports.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  initNav('Settings');

  const profileForm = document.getElementById('profile-form');
  const profileUsername = document.getElementById('profile-username');
  const profileEmail = document.getElementById('profile-email');
  const profileDisplayName = document.getElementById('profile-display-name');
  const saveProfileBtn = document.getElementById('save-profile-btn');

  const passwordForm = document.getElementById('password-form');
  const currentPassword = document.getElementById('current-password');
  const newPassword = document.getElementById('new-password');
  const confirmPassword = document.getElementById('confirm-password');
  const changePwdBtn = document.getElementById('change-pwd-btn');

  const exportJsonBtn = document.getElementById('export-json-btn');
  const exportMemoriesBtn = document.getElementById('export-memories-btn');
  const exportTasksBtn = document.getElementById('export-tasks-btn');

  // Load profile
  async function loadProfile() {
    try {
      const res = await api.get('/users/me');
      const user = res?.data;
      if (user) {
        profileUsername.value = user.username || '';
        profileEmail.value = user.email || '';
        profileDisplayName.value = user.displayName || user.username || '';
      }
    } catch (e) {
      showError('Failed to load profile details: ' + e.message);
    }
  }

  // Update profile
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = profileDisplayName.value.trim();
    if (!name) return;

    setButtonLoading(saveProfileBtn, true, 'Updating...');
    try {
      await api.put('/users/me/display-name', { displayName: name });
      showSuccess('Profile updated.');
      if (window.updateNavDisplayName) window.updateNavDisplayName(name);
    } catch (err) {
      showError('Could not update profile: ' + err.message);
    } finally {
      setButtonLoading(saveProfileBtn, false, 'Update Profile');
    }
  });

  // Change password
  passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (newPassword.value !== confirmPassword.value) {
      showError('New passwords do not match.');
      return;
    }

    setButtonLoading(changePwdBtn, true, 'Saving...');
    try {
      await api.post('/users/me/change-password', {
        currentPassword: currentPassword.value,
        newPassword: newPassword.value
      });
      showSuccess('Password updated successfully.');
      passwordForm.reset();
    } catch (err) {
      showError(err.message || 'Failed to change password.');
    } finally {
      setButtonLoading(changePwdBtn, false, 'Change Password');
    }
  });

  // Authenticated file download helper
  async function downloadWithAuth(url, defaultFilename) {
    const token = getAccessToken();
    try {
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`Download failed with status ${res.status}`);

      // Extract filename if Content-Disposition exists
      let filename = defaultFilename;
      const disp = res.headers.get('Content-Disposition');
      if (disp && disp.includes('filename=')) {
        const match = disp.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);

      showSuccess(`Export downloaded: ${filename}`);
    } catch (err) {
      showError('Export download failed: ' + err.message);
    }
  }

  exportJsonBtn.addEventListener('click', (e) => {
    e.preventDefault();
    downloadWithAuth('/api/export/json', 'memory_vault_export.json');
  });

  exportMemoriesBtn.addEventListener('click', (e) => {
    e.preventDefault();
    downloadWithAuth('/api/export/csv?entity=memories', 'memory_vault_memories.csv');
  });

  exportTasksBtn.addEventListener('click', (e) => {
    e.preventDefault();
    downloadWithAuth('/api/export/csv?entity=tasks', 'memory_vault_tasks.csv');
  });

  loadProfile();
});
