import { renderHeader } from '../../components/header/header.js';
import { renderFooter } from '../../components/footer/footer.js';
import { requireAdmin } from '../../utils/auth.guard.js';

async function initPage() {
  try {
    await requireAdmin();
  } catch {
    return;
  }

  await renderHeader();
  await renderFooter();
}

initPage();
