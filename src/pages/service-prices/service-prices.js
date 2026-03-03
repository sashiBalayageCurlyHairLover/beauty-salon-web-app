import { renderHeader } from '../../components/header/header.js';
import { renderFooter } from '../../components/footer/footer.js';
import { listSuggestedServices } from '../../services/services-catalog.service.js';
import { requireAuth } from '../../utils/auth.guard.js';
import './service-prices.css';

function setAlert(message, variant = 'danger') {
  const alertElement = document.querySelector('#services-alert');
  if (!alertElement) {
    return;
  }

  alertElement.className = `alert alert-${variant}`;
  alertElement.textContent = message;
}

function formatPrice(price) {
  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice)) {
    return 'N/A';
  }

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  }).format(numericPrice);
}

function renderServices(services) {
  const listElement = document.querySelector('#services-list');
  if (!listElement) {
    return;
  }

  if (!services || services.length === 0) {
    listElement.innerHTML = '<p class="text-muted mb-0">No suggested services available at the moment.</p>';
    return;
  }

  listElement.innerHTML = services
    .map((service) => {
      const duration = Number.isFinite(Number(service.duration_minutes))
        ? `${service.duration_minutes} min`
        : 'N/A';

      return `
        <article class="col-md-6 col-lg-4">
          <div class="border rounded p-3 h-100 d-flex flex-column">
            <h2 class="h5 mb-2">${service.name}</h2>
            <p class="text-muted small mb-2">Category: ${service.category_name || 'General'}</p>
            <p class="mb-3 flex-grow-1">${service.description || 'No description available.'}</p>
            <p class="mb-1"><strong>Duration:</strong> ${duration}</p>
            <p class="mb-0"><strong>Price:</strong> ${formatPrice(service.price)}</p>
          </div>
        </article>
      `;
    })
    .join('');
}

async function initPage() {
  try {
    await requireAuth();
  } catch {
    return;
  }

  await renderHeader();
  await renderFooter();

  try {
    const services = await listSuggestedServices();
    renderServices(services);
  } catch (error) {
    setAlert(error.message || 'Unable to load services right now.');
  }
}

initPage();
