import { renderHeader } from '../../components/header/header.js';
import { renderFooter } from '../../components/footer/footer.js';
import './contact.css';

function setAlert(message, variant = 'danger') {
  const alertElement = document.querySelector('#contact-alert');
  if (!alertElement) {
    return;
  }

  alertElement.className = `alert alert-${variant}`;
  alertElement.textContent = message;
}

function wireContactForm() {
  const form = document.querySelector('#contact-form');
  const submitButton = document.querySelector('#contact-submit');

  form?.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = document.querySelector('#contact-name')?.value?.trim() || '';
    const email = document.querySelector('#contact-email')?.value?.trim() || '';
    const message = document.querySelector('#contact-message')?.value?.trim() || '';

    if (!name || !email || !message) {
      setAlert('Please fill in all fields.');
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
    }

    setAlert('Message sent successfully. We will contact you soon.', 'success');
    form.reset();

    if (submitButton) {
      submitButton.disabled = false;
    }
  });
}

async function initPage() {
  await renderHeader();
  await renderFooter();
  wireContactForm();
}

initPage();
