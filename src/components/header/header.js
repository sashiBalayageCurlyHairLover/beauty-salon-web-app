import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap';
import { getCurrentUser, getUserRole, logoutUser } from '../../services/auth.service.js';
import headerTemplate from './header.html?raw';
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
  const adminItem = mountElement.querySelector('#nav-admin-item');
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
  let isAdmin = false;

  if (isAuthenticated) {
    try {
      const role = await getUserRole(user.id);
      isAdmin = role === 'admin';
    } catch {
      isAdmin = false;
    }
  }

  if (adminItem) {
    adminItem.classList.toggle('d-none', !isAdmin);
  }

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

  mountElement.innerHTML = headerTemplate;

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
