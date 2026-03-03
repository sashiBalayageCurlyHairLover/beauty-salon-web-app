import { renderHeader } from '../../components/header/header.js';
import { renderFooter } from '../../components/footer/footer.js';
import { mountAppointmentEditor } from '../../components/appointment-editor/appointment-editor.js';
import { getCurrentUser } from '../../services/auth.service.js';
import {
  getUserAppointmentById,
  updateUserAppointment
} from '../../services/appointments.service.js';
import { syncAppointmentAttachments } from '../../services/appointment-attachments.service.js';
import './edit.css';

let authenticatedUser = null;
let appointmentId = null;

function setAlert(message, variant = 'danger') {
  const alertElement = document.querySelector('#appointment-form-alert');
  if (!alertElement) {
    return;
  }

  alertElement.className = `alert alert-${variant}`;
  alertElement.textContent = message;
}

async function getCurrentAppointment() {
  if (!authenticatedUser || !appointmentId) {
    return null;
  }

  const appointment = await getUserAppointmentById(authenticatedUser.id, appointmentId);

  if (!appointment) {
    throw new Error('Appointment not found.');
  }

  return appointment;
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

    authenticatedUser = user;
  } catch {
    window.location.href = '/login/';
    return;
  }

  const params = new URLSearchParams(window.location.search);
  appointmentId = params.get('id');

  if (!appointmentId) {
    setAlert('Missing appointment id in URL.');
    return;
  }

  try {
    const appointment = await getCurrentAppointment();

    await mountAppointmentEditor({
      mode: 'edit',
      appointmentId,
      submitLabel: 'Save Changes',
      initialValues: appointment,
      onSubmit: async ({ payload, newFiles, removeAttachmentIds }) => {
        await updateUserAppointment(authenticatedUser.id, appointmentId, payload);

        await syncAppointmentAttachments({
          appointmentId,
          userId: authenticatedUser.id,
          newFiles,
          removeAttachmentIds
        });

        sessionStorage.setItem('appointments-toast', 'Appointment updated successfully.');
        window.location.href = '/appointments/';
      }
    });
  } catch (error) {
    setAlert(error.message || 'Unable to load appointment data.');
  }
}

initPage();
