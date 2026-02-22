import { renderHeader } from '../../components/header/header.js';
import { renderFooter } from '../../components/footer/footer.js';
import { getCurrentUser, logoutUser } from '../../services/auth.service.js';
import {
	countUserAppointments,
	createUserAppointment,
	deleteUserAppointment,
	listServiceOptions,
	listStaffOptions,
	listUserAppointments,
	updateUserAppointment
} from '../../services/appointments.service.js';
import './profile.css';

const pageState = {
	user: null,
	appointments: [],
	editingAppointmentId: null
};

function setAlert(message, variant = 'danger') {
	const alertElement = document.querySelector('#appointment-alert');
	if (!alertElement) {
		return;
	}

	alertElement.className = `alert alert-${variant}`;
	alertElement.textContent = message;
}

function resetAppointmentForm() {
	const form = document.querySelector('#appointment-form');
	const title = document.querySelector('#appointment-form-title');
	const idInput = document.querySelector('#appointment-id');
	const submitButton = document.querySelector('#appointment-submit');
	const cancelButton = document.querySelector('#appointment-cancel-edit');

	form?.reset();
	if (idInput) {
		idInput.value = '';
	}

	pageState.editingAppointmentId = null;

	if (title) {
		title.textContent = 'Create Appointment';
	}

	if (submitButton) {
		submitButton.textContent = 'Create Appointment';
	}

	cancelButton?.classList.add('d-none');
}

function formatAppointmentLabel(appointment) {
	return `${appointment.appointment_date} ${appointment.appointment_time.slice(0, 5)}`;
}

function renderAppointments() {
	const listElement = document.querySelector('#appointments-list');
	if (!listElement) {
		return;
	}

	if (pageState.appointments.length === 0) {
		listElement.innerHTML = '<p class="text-muted mb-0">No appointments yet.</p>';
		return;
	}

	listElement.innerHTML = pageState.appointments
		.map((appointment) => {
			const serviceName = appointment.services?.name || 'N/A';
			const staffName = appointment.staff?.full_name || 'N/A';

			return `
				<article class="border rounded p-3">
					<div class="d-flex justify-content-between align-items-start gap-2 flex-wrap">
						<div>
							<p class="fw-semibold mb-1">${formatAppointmentLabel(appointment)}</p>
							<p class="mb-1 text-muted">Status: ${appointment.status}</p>
							<p class="mb-1 text-muted">Service: ${serviceName}</p>
							<p class="mb-2 text-muted">Staff: ${staffName}</p>
						</div>
						<div class="d-flex gap-2 flex-wrap">
							<a class="btn btn-sm btn-outline-dark" href="/appointment/?id=${appointment.id}">Details</a>
							<button class="btn btn-sm btn-dark" type="button" data-action="edit" data-id="${appointment.id}">Edit</button>
							<button class="btn btn-sm btn-outline-danger" type="button" data-action="delete" data-id="${appointment.id}">Delete</button>
						</div>
					</div>
				</article>
			`;
		})
		.join('');
}

async function refreshAppointments() {
	if (!pageState.user) {
		return;
	}

	const [appointments, appointmentsCount] = await Promise.all([
		listUserAppointments(pageState.user.id),
		countUserAppointments(pageState.user.id)
	]);

	pageState.appointments = appointments;

	const countElement = document.querySelector('#appointments-count');
	if (countElement) {
		countElement.textContent = String(appointmentsCount);
	}

	renderAppointments();
}

function toFormPayload() {
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

function startEditingAppointment(appointmentId) {
	const appointment = pageState.appointments.find((item) => item.id === appointmentId);
	if (!appointment) {
		return;
	}

	pageState.editingAppointmentId = appointmentId;

	const title = document.querySelector('#appointment-form-title');
	const idInput = document.querySelector('#appointment-id');
	const dateInput = document.querySelector('#appointment-date');
	const timeInput = document.querySelector('#appointment-time');
	const statusSelect = document.querySelector('#appointment-status');
	const notesInput = document.querySelector('#appointment-notes');
	const serviceSelect = document.querySelector('#appointment-service');
	const staffSelect = document.querySelector('#appointment-staff');
	const submitButton = document.querySelector('#appointment-submit');
	const cancelButton = document.querySelector('#appointment-cancel-edit');

	if (title) {
		title.textContent = 'Edit Appointment';
	}

	if (idInput) {
		idInput.value = appointment.id;
	}

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

	if (submitButton) {
		submitButton.textContent = 'Save Changes';
	}

	cancelButton?.classList.remove('d-none');
}

async function hydrateFormOptions() {
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

function wireAppointmentActions() {
	const form = document.querySelector('#appointment-form');
	const submitButton = document.querySelector('#appointment-submit');
	const cancelEditButton = document.querySelector('#appointment-cancel-edit');
	const listElement = document.querySelector('#appointments-list');

	form?.addEventListener('submit', async (event) => {
		event.preventDefault();

		if (!pageState.user || !submitButton) {
			return;
		}

		submitButton.disabled = true;

		try {
			const payload = toFormPayload();

			if (pageState.editingAppointmentId) {
				await updateUserAppointment(pageState.user.id, pageState.editingAppointmentId, payload);
				setAlert('Appointment updated successfully.', 'success');
			} else {
				await createUserAppointment(pageState.user.id, payload);
				setAlert('Appointment created successfully.', 'success');
			}

			resetAppointmentForm();
			await refreshAppointments();
		} catch (error) {
			setAlert(error.message || 'Failed to save appointment.');
		} finally {
			submitButton.disabled = false;
		}
	});

	cancelEditButton?.addEventListener('click', () => {
		resetAppointmentForm();
	});

	listElement?.addEventListener('click', async (event) => {
		const target = event.target;
		if (!(target instanceof HTMLElement)) {
			return;
		}

		const action = target.dataset.action;
		const appointmentId = target.dataset.id;

		if (!action || !appointmentId || !pageState.user) {
			return;
		}

		if (action === 'edit') {
			startEditingAppointment(appointmentId);
			return;
		}

		if (action === 'delete') {
			const shouldDelete = window.confirm('Delete this appointment?');
			if (!shouldDelete) {
				return;
			}

			try {
				await deleteUserAppointment(pageState.user.id, appointmentId);
				setAlert('Appointment deleted successfully.', 'success');
				if (pageState.editingAppointmentId === appointmentId) {
					resetAppointmentForm();
				}
				await refreshAppointments();
			} catch (error) {
				setAlert(error.message || 'Failed to delete appointment.');
			}
		}
	});
}

async function initPage() {
	await renderHeader();
	await renderFooter();

	const emailElement = document.querySelector('#profile-email');
	const logoutButton = document.querySelector('#logout-btn');

	try {
		const user = await getCurrentUser();

		if (!user) {
			window.location.href = '/login/';
			return;
		}

		pageState.user = user;

		if (emailElement) {
			emailElement.textContent = user.email || 'Unknown user';
		}
	} catch {
		window.location.href = '/login/';
		return;
	}

	wireAppointmentActions();

	try {
		await hydrateFormOptions();
		await refreshAppointments();
	} catch (error) {
		setAlert(error.message || 'Unable to load appointment data.');
	}

	if (logoutButton) {
		logoutButton.addEventListener('click', async () => {
			logoutButton.disabled = true;
			try {
				await logoutUser();
				window.location.href = '/login/';
			} catch {
				logoutButton.disabled = false;
			}
		});
	}
}

initPage();
