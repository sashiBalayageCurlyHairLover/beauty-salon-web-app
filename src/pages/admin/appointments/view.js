import { renderHeader } from '../../../components/header/header.js';
import { renderFooter } from '../../../components/footer/footer.js';
import { listAppointmentAttachments } from '../../../services/appointment-attachments.service.js';
import { getAdminAppointmentById } from '../../../services/admin.service.js';
import { requireAdmin } from '../../../utils/auth.guard.js';

function setAlert(message, variant = 'danger') {
  const alertElement = document.querySelector('#admin-appointment-alert');
  if (!alertElement) {
    return;
  }

  alertElement.className = `alert alert-${variant}`;
  alertElement.textContent = message;
}

function renderDetail(appointment) {
  const contentElement = document.querySelector('#admin-appointment-content');
  if (!contentElement) {
    return;
  }

  const serviceName = appointment.services?.name || 'N/A';
  const staffName = appointment.staff?.full_name || 'N/A';
  const clientEmail = appointment.client?.email || 'Unknown';

  contentElement.innerHTML = `
    <p><strong>Client:</strong> ${clientEmail}</p>
    <p><strong>Date:</strong> ${appointment.appointment_date}</p>
    <p><strong>Time:</strong> ${appointment.appointment_time.slice(0, 5)}</p>
    <p><strong>Status:</strong> ${appointment.status}</p>
    <p><strong>Service:</strong> ${serviceName}</p>
    <p><strong>Staff:</strong> ${staffName}</p>
    <p><strong>Notes:</strong> ${appointment.notes || 'N/A'}</p>
    <p class="text-muted mb-0"><strong>Created:</strong> ${new Date(appointment.created_at).toLocaleString()}</p>
  `;
}

function renderAttachments(attachments) {
  const attachmentsElement = document.querySelector('#admin-appointment-attachments');
  if (!attachmentsElement) {
    return;
  }

  if (!attachments || attachments.length === 0) {
    attachmentsElement.innerHTML = `
      <h2 class="h5 mb-2">Attachments</h2>
      <p class="text-muted mb-0">No attachments.</p>
    `;
    return;
  }

  attachmentsElement.innerHTML = `
    <h2 class="h5 mb-2">Attachments</h2>
    <ul class="mb-0 ps-3">
      ${attachments.map((item) => `<li>${item.file_name}</li>`).join('')}
    </ul>
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
  const appointmentId = params.get('id');

  if (!appointmentId) {
    setAlert('Missing appointment id in URL.');
    return;
  }

  try {
    const [appointment, attachments] = await Promise.all([
      getAdminAppointmentById(appointmentId),
      listAppointmentAttachments(appointmentId)
    ]);

    if (!appointment) {
      setAlert('Appointment not found.');
      return;
    }

    renderDetail(appointment);
    renderAttachments(attachments);
  } catch (error) {
    setAlert(error.message || 'Unable to load appointment details.');
  }
}

initPage();
