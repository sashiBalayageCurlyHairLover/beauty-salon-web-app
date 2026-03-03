import { renderHeader } from '../../../components/header/header.js';
import { renderFooter } from '../../../components/footer/footer.js';
import { getAdminUserById } from '../../../services/admin.service.js';
import { requireAdmin } from '../../../utils/auth.guard.js';

function setAlert(message, variant = 'danger') {
  const alertElement = document.querySelector('#admin-user-alert');
  if (!alertElement) {
    return;
  }

  alertElement.className = `alert alert-${variant}`;
  alertElement.textContent = message;
}

function renderUser(user) {
  const contentElement = document.querySelector('#admin-user-content');
  if (!contentElement) {
    return;
  }

  contentElement.innerHTML = `
    <p><strong>Email:</strong> ${user.email || 'Unknown'}</p>
    <p><strong>Full Name:</strong> ${user.full_name || 'N/A'}</p>
    <p><strong>Phone:</strong> ${user.phone || 'N/A'}</p>
    <p><strong>Role:</strong> ${user.role || 'client'}</p>
    <p class="text-muted mb-0"><strong>Created:</strong> ${new Date(user.created_at).toLocaleString()}</p>
  `;
}

async function initPage() {
  try {
    await requireAdmin();
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

  try {
    const user = await getAdminUserById(userId);

    if (!user) {
      setAlert('User not found.');
      return;
    }

    renderUser(user);
  } catch (error) {
    setAlert(error.message || 'Unable to load user details.');
  }
}

initPage();
