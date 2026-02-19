import { renderHeader } from '../../components/header/header.js';
import { renderFooter } from '../../components/footer/footer.js';
import './index.css';

async function initPage() {
	await renderHeader();
	await renderFooter();
}

initPage();
