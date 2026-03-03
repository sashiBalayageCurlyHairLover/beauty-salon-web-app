import footerTemplate from './footer.html?raw';
import './footer.css';

/**
 * Renders the shared footer into a mount point.
 * @param {string} targetSelector CSS selector for mount element.
 */
export async function renderFooter(targetSelector = '#footer-root') {
  const mountElement = document.querySelector(targetSelector);

  if (!mountElement) {
    return;
  }

  mountElement.innerHTML = footerTemplate;
}
