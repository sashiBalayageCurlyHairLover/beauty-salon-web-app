import { Toast } from 'bootstrap';

/**
 * Shows a Bootstrap toast notification.
 * @param {string} message
 * @param {'success'|'danger'|'warning'|'info'} variant
 */
export function showToast(message, variant = 'success') {
  const existingContainer = document.querySelector('#toast-container');
  const container =
    existingContainer ||
    Object.assign(document.createElement('div'), {
      id: 'toast-container',
      className: 'toast-container position-fixed top-0 end-0 p-3'
    });

  if (!existingContainer) {
    document.body.appendChild(container);
  }

  const toastElement = document.createElement('div');
  const backgroundClass =
    variant === 'danger'
      ? 'text-bg-danger'
      : variant === 'warning'
        ? 'text-bg-warning'
        : variant === 'info'
          ? 'text-bg-info'
          : 'text-bg-success';

  toastElement.className = `toast align-items-center border-0 ${backgroundClass}`;
  toastElement.role = 'status';
  toastElement.ariaLive = 'polite';
  toastElement.ariaAtomic = 'true';
  toastElement.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  container.appendChild(toastElement);

  const toast = new Toast(toastElement, {
    autohide: true,
    delay: 2600
  });

  toastElement.addEventListener('hidden.bs.toast', () => {
    toastElement.remove();
  });

  toast.show();
}
