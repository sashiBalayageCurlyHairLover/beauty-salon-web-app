import { renderHeader } from '../../../components/header/header.js';
import { renderFooter } from '../../../components/footer/footer.js';
import { showToast } from '../../../components/toast/toast.js';
import { deleteAdminAppointment, listAdminAppointments } from '../../../services/admin.service.js';
import { requireAdmin } from '../../../utils/auth.guard.js';
import './list.css';

const state = {
  appointments: []
};

function setAlert(message, variant = 'danger') {
  const alertElement = document.querySelector('#admin-appointments-alert');
  if (!alertElement) {
    return;
  }

  alertElement.className = `alert alert-${variant}`;
  alertElement.textContent = message;
}

function formatLabel(appointment) {
  return `${appointment.appointment_date} ${appointment.appointment_time.slice(0, 5)}`;
}

function renderAppointments() {
  const listElement = document.querySelector('#admin-appointments-list');
  if (!listElement) {
    return;
  }

  if (state.appointments.length === 0) {
    listElement.innerHTML = '<p class="text-muted mb-0">No appointments found.</p>';
    return;
  }

  listElement.innerHTML = state.appointments
    .map((appointment) => {
      const serviceName = appointment.services?.name || 'N/A';
      const staffName = appointment.staff?.full_name || 'N/A';
      const clientEmail = appointment.client?.email || 'Unknown';

      return `
        <article class="border rounded p-3">
          <div class="d-flex justify-content-between align-items-start gap-2 flex-wrap">
            <div>
              <p class="fw-semibold mb-1">${formatLabel(appointment)}</p>
              <p class="mb-1 text-muted">Client: ${clientEmail}</p>
              <p class="mb-1 text-muted">Status: ${appointment.status}</p>
              <p class="mb-1 text-muted">Service: ${serviceName}</p>
              <p class="mb-2 text-muted">Staff: ${staffName}</p>
            </div>
            <div class="d-flex gap-2 flex-wrap">
              <a class="btn btn-sm btn-outline-dark" href="/admin/appointments/view/?id=${appointment.id}">View</a>
              <a class="btn btn-sm btn-dark" href="/admin/appointments/edit/?id=${appointment.id}">Edit</a>
              <button class="btn btn-sm btn-outline-danger" type="button" data-action="delete" data-id="${appointment.id}">Delete</button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}

async function refreshData() {
  state.appointments = await listAdminAppointments();
  renderAppointments();
}

function wireActions() {
  const listElement = document.querySelector('#admin-appointments-list');

  listElement?.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const action = target.dataset.action;
    const appointmentId = target.dataset.id;

    if (action !== 'delete' || !appointmentId) {
      return;
    }

    const shouldDelete = window.confirm('Delete this appointment?');
    if (!shouldDelete) {
      return;
    }

    try {
      await deleteAdminAppointment(appointmentId);
      setAlert('Appointment deleted successfully.', 'success');
      await refreshData();
    } catch (error) {
      setAlert(error.message || 'Failed to delete appointment.');
    }
  });
}

async function initPage() {
  try {
    await requireAdmin();
  } catch {
    return;
  }

  await renderHeader();
  await renderFooter();

  const savedToastMessage = sessionStorage.getItem('admin-appointments-toast');
  if (savedToastMessage) {
    showToast(savedToastMessage, 'success');
    sessionStorage.removeItem('admin-appointments-toast');
  }

  wireActions();

  try {
    await refreshData();
  } catch (error) {
    setAlert(error.message || 'Unable to load appointments.');
  }
}

initPage();
