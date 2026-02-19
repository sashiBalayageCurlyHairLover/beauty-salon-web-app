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

  const response = await fetch('/components/footer/footer.html');
  const template = await response.text();
  mountElement.innerHTML = template;
}
