import { renderHeader } from '../../../components/header/header.js';
import { renderFooter } from '../../../components/footer/footer.js';
import { getCurrentUser } from '../../../services/auth.service.js';
import { getAdminUserById, updateAdminUser } from '../../../services/admin.service.js';
import { requireAdmin } from '../../../utils/auth.guard.js';
import './edit.css';

function setAlert(message, variant = 'danger') {
  const alertElement = document.querySelector('#admin-user-edit-alert');
  if (!alertElement) {
    return;
  }

  alertElement.className = `alert alert-${variant}`;
  alertElement.textContent = message;
}

function applyUser(user) {
  const emailInput = document.querySelector('#admin-user-email');
  const nameInput = document.querySelector('#admin-user-full-name');
  const phoneInput = document.querySelector('#admin-user-phone');
  const roleSelect = document.querySelector('#admin-user-role');

  if (emailInput) {
    emailInput.value = user.email || '';
  }

  if (nameInput) {
    nameInput.value = user.full_name || '';
  }

  if (phoneInput) {
    phoneInput.value = user.phone || '';
  }

  if (roleSelect) {
    roleSelect.value = user.role || 'client';
  }
}

function wireForm({ userId, currentUserId }) {
  const form = document.querySelector('#admin-user-edit-form');
  const submitButton = document.querySelector('#admin-user-edit-submit');

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!submitButton) {
      return;
    }

    const fullName = document.querySelector('#admin-user-full-name')?.value?.trim() || null;
    const phone = document.querySelector('#admin-user-phone')?.value?.trim() || null;
    const role = document.querySelector('#admin-user-role')?.value || 'client';

    if (userId === currentUserId && role !== 'admin') {
      setAlert('You cannot remove your own admin role.');
      return;
    }

    submitButton.disabled = true;

    try {
      await updateAdminUser({
        userId,
        fullName,
        phone,
        role
      });

      sessionStorage.setItem('admin-users-toast', 'User updated successfully.');
      window.location.href = '/admin/users/';
    } catch (error) {
      setAlert(error.message || 'Failed to update user.');
      submitButton.disabled = false;
    }
  });
}

async function initPage() {
  let currentUser;

  try {
    await requireAdmin();
    currentUser = await getCurrentUser();
  } catch {
    return;
  }

  await renderHeader();
  await renderFooter();

  const params = new URLSearchParams(window.location.search);
  const userId = params.get('id');

  if (!userId) {
    setAlert('Missing user id in URL.');
    return;
  }

  wireForm({
    userId,
    currentUserId: currentUser?.id || null
  });

  try {
    const user = await getAdminUserById(userId);

    if (!user) {
      setAlert('User not found.');
      return;
    }

    applyUser(user);
  } catch (error) {
    setAlert(error.message || 'Unable to load user.');
  }
}

initPage();
