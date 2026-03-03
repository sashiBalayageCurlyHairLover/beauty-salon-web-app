import { renderHeader } from '../../../components/header/header.js';
import { renderFooter } from '../../../components/footer/footer.js';
import { showToast } from '../../../components/toast/toast.js';
import { deleteAdminUser, listAdminUsers } from '../../../services/admin.service.js';
import { getCurrentUser } from '../../../services/auth.service.js';
import { requireAdmin } from '../../../utils/auth.guard.js';
import './list.css';

const state = {
  users: [],
  currentUserId: null
};

function setAlert(message, variant = 'danger') {
  const alertElement = document.querySelector('#admin-users-alert');
  if (!alertElement) {
    return;
  }

  alertElement.className = `alert alert-${variant}`;
  alertElement.textContent = message;
}

function renderUsers() {
  const listElement = document.querySelector('#admin-users-list');
  if (!listElement) {
    return;
  }

  if (state.users.length === 0) {
    listElement.innerHTML = '<p class="text-muted mb-0">No users found.</p>';
    return;
  }

  listElement.innerHTML = state.users
    .map((user) => {
      const isSelf = user.id === state.currentUserId;

      return `
        <article class="border rounded p-3">
          <div class="d-flex justify-content-between align-items-start gap-2 flex-wrap">
            <div>
              <p class="fw-semibold mb-1">${user.email || 'Unknown email'}</p>
              <p class="mb-1 text-muted">Name: ${user.full_name || 'N/A'}</p>
              <p class="mb-1 text-muted">Phone: ${user.phone || 'N/A'}</p>
              <p class="mb-1 text-muted">Role: ${user.role || 'client'}</p>
              <p class="mb-0 text-muted">Created: ${new Date(user.created_at).toLocaleString()}</p>
            </div>
            <div class="d-flex gap-2 flex-wrap">
              <a class="btn btn-sm btn-outline-dark" href="/admin/users/view/?id=${user.id}">View</a>
              <a class="btn btn-sm btn-dark" href="/admin/users/edit/?id=${user.id}">Edit</a>
              <button class="btn btn-sm btn-outline-danger" type="button" data-action="delete" data-id="${user.id}" ${isSelf ? 'disabled' : ''}>Delete</button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}

async function refreshData() {
  state.users = await listAdminUsers();
  renderUsers();
}

function wireActions() {
  const listElement = document.querySelector('#admin-users-list');

  listElement?.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const action = target.dataset.action;
    const userId = target.dataset.id;

    if (action !== 'delete' || !userId) {
      return;
    }

    const shouldDelete = window.confirm('Delete this user account?');
    if (!shouldDelete) {
      return;
    }

    try {
      await deleteAdminUser(userId);
      setAlert('User deleted successfully.', 'success');
      await refreshData();
    } catch (error) {
      setAlert(error.message || 'Failed to delete user.');
    }
  });
}

async function initPage() {
  try {
    await requireAdmin();
    const currentUser = await getCurrentUser();
    state.currentUserId = currentUser?.id || null;
  } catch {
    return;
  }

  await renderHeader();
  await renderFooter();

  const savedToastMessage = sessionStorage.getItem('admin-users-toast');
  if (savedToastMessage) {
    showToast(savedToastMessage, 'success');
    sessionStorage.removeItem('admin-users-toast');
  }

  wireActions();

  try {
    await refreshData();
  } catch (error) {
    setAlert(error.message || 'Unable to load users.');
  }
}

initPage();
