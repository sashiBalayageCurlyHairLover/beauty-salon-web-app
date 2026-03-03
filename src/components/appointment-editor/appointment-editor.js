import { listServiceOptions, listStaffOptions } from '../../services/appointments.service.js';
import { listAppointmentAttachments } from '../../services/appointment-attachments.service.js';
import './appointment-editor.css';

function formatBytes(size) {
  if (!Number.isFinite(size) || size <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** exponent;

  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

function normalizeTimeValue(timeValue) {
  if (!timeValue) {
    return '';
  }

  return String(timeValue).slice(0, 5);
}

/**
 * Mounts a reusable appointment editor form.
 * @param {{
 * mountSelector?:string,
 * mode:'create'|'edit',
 * submitLabel:string,
 * cancelHref?:string,
 * appointmentId?:string|null,
 * initialValues?:{
 *   appointment_date?:string,
 *   appointment_time?:string,
 *   status?:string,
 *   notes?:string|null,
 *   service_id?:string|null,
 *   staff_id?:string|null
 * },
 * onSubmit:(args:{payload:{appointment_date:string,appointment_time:string,status:string,notes:string|null,service_id:string|null,staff_id:string|null},newFiles:File[],removeAttachmentIds:string[]})=>Promise<void>
 * }} options
 */
export async function mountAppointmentEditor(options) {
  const {
    mountSelector = '#appointment-editor-root',
    mode,
    submitLabel,
    cancelHref = '/appointments/',
    appointmentId = null,
    initialValues = {},
    onSubmit
  } = options;

  const mountElement = document.querySelector(mountSelector);

  if (!mountElement) {
    throw new Error('Appointment editor mount point not found.');
  }

  if (!onSubmit || typeof onSubmit !== 'function') {
    throw new Error('Appointment editor requires an onSubmit handler.');
  }

  mountElement.innerHTML = `
    <div id="appointment-form-alert" class="alert d-none" role="alert"></div>

    <form id="appointment-form" novalidate>
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label" for="appointment-date">Date</label>
          <input id="appointment-date" class="form-control" type="date" required />
        </div>

        <div class="col-md-6">
          <label class="form-label" for="appointment-time">Time</label>
          <input id="appointment-time" class="form-control" type="time" required />
        </div>

        <div class="col-md-6">
          <label class="form-label" for="appointment-status">Status</label>
          <select id="appointment-status" class="form-select" required>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div class="col-md-6">
          <label class="form-label" for="appointment-service">Service (optional)</label>
          <select id="appointment-service" class="form-select">
            <option value="">None</option>
          </select>
        </div>

        <div class="col-md-6">
          <label class="form-label" for="appointment-staff">Staff (optional)</label>
          <select id="appointment-staff" class="form-select">
            <option value="">None</option>
          </select>
        </div>

        <div class="col-12">
          <label class="form-label" for="appointment-notes">Notes</label>
          <textarea id="appointment-notes" class="form-control" rows="3"></textarea>
        </div>

        <div class="col-12">
          <h2 class="h5 mb-2">Attachments</h2>
          <p class="text-muted small mb-3">Files are uploaded after you save changes.</p>

          <div class="mb-3">
            <label class="form-label" for="appointment-attachments-input">Attach files or images</label>
            <input id="appointment-attachments-input" class="form-control" type="file" multiple />
          </div>

          <div>
            <h3 class="h6">Current attachments</h3>
            <ul id="existing-attachments-list" class="attachments-list"></ul>
          </div>

          <div class="mt-3">
            <h3 class="h6">New files to upload</h3>
            <ul id="new-attachments-list" class="attachments-list"></ul>
          </div>
        </div>
      </div>

      <div class="mt-3 d-flex gap-2">
        <button id="appointment-submit" class="btn btn-dark" type="submit">${submitLabel}</button>
        <a class="btn btn-outline-dark" href="${cancelHref}">Cancel</a>
      </div>
    </form>
  `;

  const alertElement = mountElement.querySelector('#appointment-form-alert');
  const form = mountElement.querySelector('#appointment-form');
  const submitButton = mountElement.querySelector('#appointment-submit');
  const serviceSelect = mountElement.querySelector('#appointment-service');
  const staffSelect = mountElement.querySelector('#appointment-staff');
  const existingList = mountElement.querySelector('#existing-attachments-list');
  const newList = mountElement.querySelector('#new-attachments-list');
  const fileInput = mountElement.querySelector('#appointment-attachments-input');

  const existingAttachments = [];
  const removedAttachmentIds = new Set();
  const newFiles = [];

  const setAlert = (message, variant = 'danger') => {
    if (!alertElement) {
      return;
    }

    if (!message) {
      alertElement.className = 'alert d-none';
      alertElement.textContent = '';
      return;
    }

    alertElement.className = `alert alert-${variant}`;
    alertElement.textContent = message;
  };

  const renderExistingAttachments = () => {
    if (!existingList) {
      return;
    }

    if (existingAttachments.length === 0) {
      existingList.innerHTML = '<li><p class="attachment-empty">No attachments yet.</p></li>';
      return;
    }

    existingList.innerHTML = existingAttachments
      .map((attachment) => {
        const isRemoved = removedAttachmentIds.has(attachment.id);
        const buttonLabel = isRemoved ? 'Undo' : 'Remove';
        const buttonClass = isRemoved ? 'btn-outline-secondary' : 'btn-outline-danger';

        return `
          <li class="attachment-item ${isRemoved ? 'attachment-removed' : ''}" data-existing-id="${attachment.id}">
            <div>
              <div class="fw-medium">${attachment.file_name}</div>
              <div class="attachment-meta">${formatBytes(attachment.file_size)}</div>
            </div>
            <button class="btn btn-sm ${buttonClass}" type="button" data-existing-toggle="${attachment.id}">${buttonLabel}</button>
          </li>
        `;
      })
      .join('');
  };

  const renderNewFiles = () => {
    if (!newList) {
      return;
    }

    if (newFiles.length === 0) {
      newList.innerHTML = '<li><p class="attachment-empty">No new files selected.</p></li>';
      return;
    }

    newList.innerHTML = newFiles
      .map(
        (file, index) => `
          <li class="attachment-item" data-new-index="${index}">
            <div>
              <div class="fw-medium">${file.name}</div>
              <div class="attachment-meta">${formatBytes(file.size)}</div>
            </div>
            <button class="btn btn-sm btn-outline-danger" type="button" data-new-remove="${index}">Remove</button>
          </li>
        `
      )
      .join('');
  };

  const hydrateOptions = async () => {
    const [services, staff] = await Promise.all([listServiceOptions(), listStaffOptions()]);

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
  };

  const applyInitialValues = () => {
    const dateInput = mountElement.querySelector('#appointment-date');
    const timeInput = mountElement.querySelector('#appointment-time');
    const statusSelect = mountElement.querySelector('#appointment-status');
    const notesInput = mountElement.querySelector('#appointment-notes');

    if (dateInput) {
      dateInput.value = initialValues.appointment_date || '';
    }

    if (timeInput) {
      timeInput.value = normalizeTimeValue(initialValues.appointment_time);
    }

    if (statusSelect) {
      statusSelect.value = initialValues.status || 'pending';
    }

    if (notesInput) {
      notesInput.value = initialValues.notes || '';
    }

    if (serviceSelect) {
      serviceSelect.value = initialValues.service_id || '';
    }

    if (staffSelect) {
      staffSelect.value = initialValues.staff_id || '';
    }
  };

  const hydrateExistingAttachments = async () => {
    if (mode !== 'edit' || !appointmentId) {
      renderExistingAttachments();
      return;
    }

    const records = await listAppointmentAttachments(appointmentId);
    existingAttachments.push(...records);
    renderExistingAttachments();
  };

  const readPayload = () => {
    const date = mountElement.querySelector('#appointment-date')?.value || '';
    const time = mountElement.querySelector('#appointment-time')?.value || '';
    const status = mountElement.querySelector('#appointment-status')?.value || 'pending';
    const notesRaw = mountElement.querySelector('#appointment-notes')?.value ?? '';
    const serviceId = mountElement.querySelector('#appointment-service')?.value || '';
    const staffId = mountElement.querySelector('#appointment-staff')?.value || '';

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
  };

  fileInput?.addEventListener('change', () => {
    const files = Array.from(fileInput.files || []);

    files.forEach((file) => {
      newFiles.push(file);
    });

    fileInput.value = '';
    renderNewFiles();
  });

  existingList?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const attachmentId = target.dataset.existingToggle;

    if (!attachmentId) {
      return;
    }

    if (removedAttachmentIds.has(attachmentId)) {
      removedAttachmentIds.delete(attachmentId);
    } else {
      removedAttachmentIds.add(attachmentId);
    }

    renderExistingAttachments();
  });

  newList?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const indexRaw = target.dataset.newRemove;
    if (typeof indexRaw === 'undefined') {
      return;
    }

    const index = Number.parseInt(indexRaw, 10);
    if (!Number.isFinite(index) || index < 0 || index >= newFiles.length) {
      return;
    }

    newFiles.splice(index, 1);
    renderNewFiles();
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!submitButton) {
      return;
    }

    setAlert('');
    submitButton.disabled = true;

    try {
      const payload = readPayload();
      await onSubmit({
        payload,
        newFiles: [...newFiles],
        removeAttachmentIds: [...removedAttachmentIds]
      });
    } catch (error) {
      setAlert(error.message || 'Unable to save appointment.');
      submitButton.disabled = false;
    }
  });

  try {
    await hydrateOptions();
    applyInitialValues();
    await hydrateExistingAttachments();
    renderNewFiles();
  } catch (error) {
    setAlert(error.message || 'Unable to load appointment editor data.');
  }
}
