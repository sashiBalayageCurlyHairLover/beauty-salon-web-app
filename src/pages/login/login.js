import { renderHeader } from '../../components/header/header.js';
import { renderFooter } from '../../components/footer/footer.js';
import { loginUser } from '../../services/auth.service.js';
import './login.css';

function setAlert(message, variant = 'danger') {
  const alertElement = document.querySelector('#login-alert');
  if (!alertElement) {
    return;
  }

  alertElement.className = `alert alert-${variant}`;
  alertElement.textContent = message;
}

async function initPage() {
  await renderHeader();
  await renderFooter();

  const form = document.querySelector('#login-form');
  const submitButton = document.querySelector('#login-submit');

  if (!form || !submitButton) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.querySelector('#login-email')?.value?.trim() || '';
    const password = document.querySelector('#login-password')?.value || '';

    if (!email || !password) {
      setAlert('Please enter email and password.');
      return;
    }

    submitButton.disabled = true;

    try {
      await loginUser(email, password);
      setAlert('Login successful. Redirecting...', 'success');
      window.location.href = '/profile/';
    } catch (error) {
      setAlert(error.message || 'Login failed. Please try again.');
    } finally {
      submitButton.disabled = false;
    }
  });
}

initPage();
