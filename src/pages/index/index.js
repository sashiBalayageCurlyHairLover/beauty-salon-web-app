import { renderHeader } from '../../components/header/header.js';
import { renderFooter } from '../../components/footer/footer.js';
import { getCurrentUser } from '../../services/auth.service.js';
import './index.css';

async function syncHomeActions() {
	const guestMessage = document.querySelector('#guest-message');
	const guestActions = document.querySelector('#guest-actions');
	const authActions = document.querySelector('#auth-actions');

	let user = null;
	try {
		user = await getCurrentUser();
	} catch {
		user = null;
	}

	const isAuthenticated = Boolean(user);

	guestMessage?.classList.toggle('d-none', isAuthenticated);
	guestActions?.classList.toggle('d-none', isAuthenticated);
	authActions?.classList.toggle('d-none', !isAuthenticated);
	authActions?.classList.toggle('d-flex', isAuthenticated);
}

async function initPage() {
	await renderHeader();
	await renderFooter();
	await syncHomeActions();
}

initPage();
