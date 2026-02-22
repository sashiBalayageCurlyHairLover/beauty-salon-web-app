import { renderHeader } from '../../components/header/header.js';
import { renderFooter } from '../../components/footer/footer.js';
import { getCurrentUser } from '../../services/auth.service.js';
import { getUserAppointmentById } from '../../services/appointments.service.js';
import './appointment.css';

function setAlert(message, variant = 'danger') {
  const alertElement = document.querySelector('#appointment-detail-alert');
  if (!alertElement) {
    return;
  }

  alertElement.className = `alert alert-${variant}`;
  alertElement.textContent = message;
}

function renderDetail(appointment) {
  const contentElement = document.querySelector('#appointment-detail-content');
  if (!contentElement) {
    return;
  }

  const serviceName = appointment.services?.name || 'N/A';
  const staffName = appointment.staff?.full_name || 'N/A';

  contentElement.innerHTML = `
    <p><strong>Date:</strong> ${appointment.appointment_date}</p>
    <p><strong>Time:</strong> ${appointment.appointment_time.slice(0, 5)}</p>
    <p><strong>Status:</strong> ${appointment.status}</p>
    <p><strong>Service:</strong> ${serviceName}</p>
    <p><strong>Staff:</strong> ${staffName}</p>
    <p><strong>Notes:</strong> ${appointment.notes || 'N/A'}</p>
    <p class="text-muted mb-0"><strong>Created:</strong> ${new Date(appointment.created_at).toLocaleString()}</p>
  `;
}

async function initPage() {
  await renderHeader();
  await renderFooter();

  let user;

  try {
    user = await getCurrentUser();
  } catch {
    window.location.href = '/login/';
    return;
  }

  if (!user) {
    window.location.href = '/login/';
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const appointmentId = params.get('id');

  if (!appointmentId) {
    setAlert('Missing appointment id in URL.');
    return;
  }

  try {
    const appointment = await getUserAppointmentById(user.id, appointmentId);

    if (!appointment) {
      setAlert('Appointment not found.');
      return;
    }

    renderDetail(appointment);
  } catch (error) {
    setAlert(error.message || 'Unable to load appointment details.');
  }
}

initPage();
