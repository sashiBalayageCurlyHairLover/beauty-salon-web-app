import { renderHeader } from '../../components/header/header.js';
import { renderFooter } from '../../components/footer/footer.js';
import { getCurrentUser } from '../../services/auth.service.js';
import {
  countUserAppointments,
  deleteUserAppointment,
  listUserAppointments
} from '../../services/appointments.service.js';
import './list.css';

const state = {
  user: null,
  appointments: []
};

function setAlert(message, variant = 'danger') {
  const alertElement = document.querySelector('#appointments-alert');
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
  const listElement = document.querySelector('#appointments-list');
  if (!listElement) {
    return;
  }

  if (state.appointments.length === 0) {
    listElement.innerHTML = '<p class="text-muted mb-0">No appointments yet.</p>';
    return;
  }

  listElement.innerHTML = state.appointments
    .map((appointment) => {
      const serviceName = appointment.services?.name || 'N/A';
      const staffName = appointment.staff?.full_name || 'N/A';

      return `
        <article class="border rounded p-3">
          <div class="d-flex justify-content-between align-items-start gap-2 flex-wrap">
            <div>
              <p class="fw-semibold mb-1">${formatLabel(appointment)}</p>
              <p class="mb-1 text-muted">Status: ${appointment.status}</p>
              <p class="mb-1 text-muted">Service: ${serviceName}</p>
              <p class="mb-2 text-muted">Staff: ${staffName}</p>
            </div>
            <div class="d-flex gap-2 flex-wrap">
              <a class="btn btn-sm btn-outline-dark" href="/appointment/?id=${appointment.id}">Details</a>
              <a class="btn btn-sm btn-dark" href="/appointments/edit/?id=${appointment.id}">Edit</a>
              <button class="btn btn-sm btn-outline-danger" type="button" data-action="delete" data-id="${appointment.id}">Delete</button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}

async function refreshData() {
  if (!state.user) {
    return;
  }

  const [appointments, count] = await Promise.all([
    listUserAppointments(state.user.id),
    countUserAppointments(state.user.id)
  ]);

  state.appointments = appointments;

  const countElement = document.querySelector('#appointments-count');
  if (countElement) {
    countElement.textContent = String(count);
  }

  renderAppointments();
}

function wireActions() {
  const listElement = document.querySelector('#appointments-list');

  listElement?.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const action = target.dataset.action;
    const appointmentId = target.dataset.id;

    if (action !== 'delete' || !appointmentId || !state.user) {
      return;
    }

    const shouldDelete = window.confirm('Delete this appointment?');
    if (!shouldDelete) {
      return;
    }

    try {
      await deleteUserAppointment(state.user.id, appointmentId);
      setAlert('Appointment deleted successfully.', 'success');
      await refreshData();
    } catch (error) {
      setAlert(error.message || 'Failed to delete appointment.');
    }
  });
}

async function initPage() {
  await renderHeader();
  await renderFooter();

  try {
    const user = await getCurrentUser();

    if (!user) {
      window.location.href = '/login/';
      return;
    }

    state.user = user;
  } catch {
    window.location.href = '/login/';
    return;
  }

  wireActions();

  try {
    await refreshData();
  } catch (error) {
    setAlert(error.message || 'Unable to load appointments.');
  }
}

initPage();
