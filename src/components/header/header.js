import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap';
import { getCurrentUser, logoutUser } from '../../services/auth.service.js';
import './header.css';

const normalizePath = (pathname) => {
  if (pathname === '/index.html') {
    return '/';
  }

  if (!pathname.endsWith('/')) {
    return `${pathname}/`;
  }

  return pathname;
};

async function syncAuthActions(mountElement) {
  const registerItem = mountElement.querySelector('#nav-register-item');
  const loginItem = mountElement.querySelector('#nav-login-item');
  const logoutItem = mountElement.querySelector('#nav-logout-item');
  const logoutButton = mountElement.querySelector('#nav-logout-button');

  let user = null;

  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  const isAuthenticated = Boolean(user);

  if (registerItem) {
    registerItem.classList.toggle('d-none', isAuthenticated);
  }

  if (loginItem) {
    loginItem.classList.toggle('d-none', isAuthenticated);
  }

  if (logoutItem) {
    logoutItem.classList.toggle('d-none', !isAuthenticated);
  }

  if (isAuthenticated && logoutButton) {
    logoutButton.addEventListener('click', async (event) => {
      event.preventDefault();
      logoutButton.classList.add('disabled');
      try {
        await logoutUser();
      } finally {
        window.location.href = '/login/';
      }
    });
  }
}

/**
 * Renders the shared header into a mount point.
 * @param {string} targetSelector CSS selector for mount element.
 */
export async function renderHeader(targetSelector = '#header-root') {
  const mountElement = document.querySelector(targetSelector);

  if (!mountElement) {
    return;
  }

  const response = await fetch('/components/header/header.html');
  const template = await response.text();
  mountElement.innerHTML = template;

  const currentPath = normalizePath(window.location.pathname);
  const navLinks = mountElement.querySelectorAll('[data-route]');

  navLinks.forEach((link) => {
    const targetPath = normalizePath(link.dataset.route || '/');
    if (targetPath === currentPath) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });

  await syncAuthActions(mountElement);
}
