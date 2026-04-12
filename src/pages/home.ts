import '../styles/style.css';
import { mountSidebar } from '../lib/sidebar';
import { initShell } from '../lib/shell';
import { openInBlank } from '../lib/panic';

mountSidebar('home');
initShell();
document.getElementById('blank-btn')?.addEventListener('click', openInBlank);
