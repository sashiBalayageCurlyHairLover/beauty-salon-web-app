import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap';
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
}
