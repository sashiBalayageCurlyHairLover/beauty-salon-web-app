import { renderHeader } from '../../components/header/header.js';
import { renderFooter } from '../../components/footer/footer.js';
import { getCurrentUser } from '../../services/auth.service.js';
import {
  getUserAppointmentById,
  listServiceOptions,
  listStaffOptions,
  updateUserAppointment
} from '../../services/appointments.service.js';
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

function readPayload() {
  const date = document.querySelector('#appointment-date')?.value || '';
  const time = document.querySelector('#appointment-time')?.value || '';
  const status = document.querySelector('#appointment-status')?.value || 'pending';
  const notesRaw = document.querySelector('#appointment-notes')?.value ?? '';
  const serviceId = document.querySelector('#appointment-service')?.value || '';
  const staffId = document.querySelector('#appointment-staff')?.value || '';

  if (!date || !time) {
    throw new Error('Please provide appointment date and time.');
  }

  return {
    appointment_date: date,
    appointment_time: `${time}:00`,
    status,
    notes: notesRaw.trim() ? notesRaw.trim() : null,
    service_id: serviceId || null,
    staff_id: staffId || null
  };
}

async function hydrateOptions() {
  const [services, staff] = await Promise.all([listServiceOptions(), listStaffOptions()]);

  const serviceSelect = document.querySelector('#appointment-service');
  const staffSelect = document.querySelector('#appointment-staff');

  if (serviceSelect) {
    serviceSelect.innerHTML =
      '<option value="">None</option>' +
      services.map((item) => `<option value="${item.id}">${item.name}</option>`).join('');
  }

  if (staffSelect) {
    staffSelect.innerHTML =
      '<option value="">None</option>' +
      staff.map((item) => `<option value="${item.id}">${item.full_name}</option>`).join('');
  }
}

async function hydrateCurrentAppointment() {
  if (!authenticatedUser || !appointmentId) {
    return;
  }

  const appointment = await getUserAppointmentById(authenticatedUser.id, appointmentId);

  if (!appointment) {
    setAlert('Appointment not found.');
    return;
  }

  const dateInput = document.querySelector('#appointment-date');
  const timeInput = document.querySelector('#appointment-time');
  const statusSelect = document.querySelector('#appointment-status');
  const notesInput = document.querySelector('#appointment-notes');
  const serviceSelect = document.querySelector('#appointment-service');
  const staffSelect = document.querySelector('#appointment-staff');

  if (dateInput) {
    dateInput.value = appointment.appointment_date;
  }

  if (timeInput) {
    timeInput.value = appointment.appointment_time.slice(0, 5);
  }

  if (statusSelect) {
    statusSelect.value = appointment.status;
  }

  if (notesInput) {
    notesInput.value = appointment.notes || '';
  }

  if (serviceSelect) {
    serviceSelect.value = appointment.service_id || '';
  }

  if (staffSelect) {
    staffSelect.value = appointment.staff_id || '';
  }
}

function wireForm() {
  const form = document.querySelector('#appointment-form');
  const submitButton = document.querySelector('#appointment-submit');

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!submitButton || !authenticatedUser || !appointmentId) {
      return;
    }

    submitButton.disabled = true;

    try {
      const payload = readPayload();
      await updateUserAppointment(authenticatedUser.id, appointmentId, payload);
      sessionStorage.setItem('appointments-toast', 'Appointment updated successfully.');
      window.location.href = '/appointments/';
    } catch (error) {
      setAlert(error.message || 'Failed to update appointment.');
      submitButton.disabled = false;
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

  wireForm();

  try {
    await hydrateOptions();
    await hydrateCurrentAppointment();
  } catch (error) {
    setAlert(error.message || 'Unable to load appointment data.');
  }
}

initPage();
