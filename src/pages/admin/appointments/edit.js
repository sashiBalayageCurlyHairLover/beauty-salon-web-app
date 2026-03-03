import { renderHeader } from '../../../components/header/header.js';
import { renderFooter } from '../../../components/footer/footer.js';
import { mountAppointmentEditor } from '../../../components/appointment-editor/appointment-editor.js';
import { syncAppointmentAttachments } from '../../../services/appointment-attachments.service.js';
import { getCurrentUser } from '../../../services/auth.service.js';
import { getAdminAppointmentById, updateAdminAppointment } from '../../../services/admin.service.js';
import { requireAdmin } from '../../../utils/auth.guard.js';
import './edit.css';

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
  const appointmentId = params.get('id');

  if (!appointmentId) {
    const root = document.querySelector('#appointment-editor-root');
    if (root) {
      root.innerHTML = '<div class="alert alert-danger" role="alert">Missing appointment id in URL.</div>';
    }
    return;
  }

  try {
    const appointment = await getAdminAppointmentById(appointmentId);

    if (!appointment) {
      throw new Error('Appointment not found.');
    }

    await mountAppointmentEditor({
      mode: 'edit',
      appointmentId,
      submitLabel: 'Save Changes',
      cancelHref: '/admin/appointments/',
      initialValues: appointment,
      onSubmit: async ({ payload, newFiles, removeAttachmentIds }) => {
        await updateAdminAppointment(appointmentId, payload);

        await syncAppointmentAttachments({
          appointmentId,
          userId: currentUser?.id,
          newFiles,
          removeAttachmentIds
        });

        sessionStorage.setItem('admin-appointments-toast', 'Appointment updated successfully.');
        window.location.href = '/admin/appointments/';
      }
    });
  } catch (error) {
    const alertElement = document.querySelector('#appointment-form-alert');
    if (alertElement) {
      alertElement.className = 'alert alert-danger';
      alertElement.textContent = error.message || 'Unable to load appointment editor.';
    } else {
      const root = document.querySelector('#appointment-editor-root');
      if (root) {
        root.innerHTML = `<div class="alert alert-danger" role="alert">${error.message || 'Unable to load appointment editor.'}</div>`;
      }
    }
  }
}

initPage();
