import { renderHeader } from '../../components/header/header.js';
import { renderFooter } from '../../components/footer/footer.js';
import { getCurrentUser, logoutUser } from '../../services/auth.service.js';
import './profile.css';

async function initPage() {
	await renderHeader();
	await renderFooter();

	const emailElement = document.querySelector('#profile-email');
	const logoutButton = document.querySelector('#logout-btn');

	try {
		const user = await getCurrentUser();

		if (!user) {
			window.location.href = '/login/';
			return;
		}

		if (emailElement) {
			emailElement.textContent = user.email || 'Unknown user';
		}
	} catch (error) {
		if (emailElement) {
			emailElement.textContent = error.message || 'Unable to load profile.';
		}
	}

	if (logoutButton) {
		logoutButton.addEventListener('click', async () => {
			logoutButton.disabled = true;
			try {
				await logoutUser();
				window.location.href = '/login/';
			} catch {
				logoutButton.disabled = false;
			}
		});
	}
}

initPage();
