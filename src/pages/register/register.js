import { renderHeader } from '../../components/header/header.js';
import { renderFooter } from '../../components/footer/footer.js';
import { registerUser } from '../../services/auth.service.js';
import './register.css';

function setAlert(message, variant = 'danger') {
  const alertElement = document.querySelector('#register-alert');
  if (!alertElement) {
    return;
  }

  alertElement.className = `alert alert-${variant}`;
  alertElement.textContent = message;
}

async function initPage() {
  await renderHeader();
  await renderFooter();

  const form = document.querySelector('#register-form');
  const submitButton = document.querySelector('#register-submit');

  if (!form || !submitButton) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.querySelector('#register-email')?.value?.trim() || '';
    const password = document.querySelector('#register-password')?.value || '';

    if (!email || !password) {
      setAlert('Please enter email and password.');
      return;
    }

    submitButton.disabled = true;

    try {
      await registerUser(email, password);
      setAlert('Registration successful. Please login.', 'success');
      setTimeout(() => {
        window.location.href = '/login/';
      }, 700);
    } catch (error) {
      setAlert(error.message || 'Registration failed. Please try again.');
    } finally {
      submitButton.disabled = false;
    }
  });
}

initPage();
