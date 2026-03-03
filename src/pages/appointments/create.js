import { renderHeader } from '../../components/header/header.js';
import { renderFooter } from '../../components/footer/footer.js';
import { mountAppointmentEditor } from '../../components/appointment-editor/appointment-editor.js';
import { getCurrentUser } from '../../services/auth.service.js';
import { createUserAppointment } from '../../services/appointments.service.js';
import { syncAppointmentAttachments } from '../../services/appointment-attachments.service.js';
import './create.css';

let authenticatedUser = null;

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

  try {
    await mountAppointmentEditor({
      mode: 'create',
      submitLabel: 'Create Appointment',
      initialValues: { status: 'pending' },
      onSubmit: async ({ payload, newFiles, removeAttachmentIds }) => {
        const createdAppointment = await createUserAppointment(authenticatedUser.id, payload);

        await syncAppointmentAttachments({
          appointmentId: createdAppointment.id,
          userId: authenticatedUser.id,
          newFiles,
          removeAttachmentIds
        });

        sessionStorage.setItem('appointments-toast', 'Appointment created successfully.');
        window.location.href = '/appointments/';
      }
    });
  } catch (error) {
    const alertElement = document.querySelector('#appointment-form-alert');
    if (alertElement) {
      alertElement.className = 'alert alert-danger';
      alertElement.textContent = error.message || 'Unable to load appointment editor.';
    }
  }
}

initPage();
