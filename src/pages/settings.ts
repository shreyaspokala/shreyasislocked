import '../styles/style.css';
import { mountSidebar } from '../lib/sidebar';
import { initShell } from '../lib/shell';
import { applyCloak } from '../lib/cloak';
import { animate } from 'motion';

mountSidebar('settings');
initShell();

const cloakSel = document.getElementById('cloak-select') as HTMLSelectElement;
const panicInput = document.getElementById('panic-url') as HTMLInputElement;
const backendInput = document.getElementById('backend-url') as HTMLInputElement;

cloakSel.value = localStorage.getItem('tabCloak') || '';
panicInput.value = localStorage.getItem('panicUrl') || 'https://www.google.com';
backendInput.value = localStorage.getItem('proxyBackend') || '';

document.getElementById('save-btn')?.addEventListener('click', () => {
  localStorage.setItem('tabCloak', cloakSel.value);
  localStorage.setItem('panicUrl', panicInput.value);
  localStorage.setItem('proxyBackend', backendInput.value.replace(/\/$/, ''));
  applyCloak();
  const btn = document.getElementById('save-btn') as HTMLElement;
  animate(btn, { scale: [1, 1.08, 1] }, { duration: 0.35 });
  const toast = document.createElement('div');
  toast.textContent = 'Saved';
  toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--accent);color:#fff;padding:10px 18px;border-radius:8px;font-size:.9rem;z-index:500;';
  document.body.appendChild(toast);
  animate(toast, { opacity: [0, 1], y: [20, 0] }, { duration: 0.25 });
  setTimeout(() => animate(toast, { opacity: [1, 0], y: [0, 20] }, { duration: 0.25 }).finished.then(() => toast.remove()), 1500);
});
animate('.setting-group', { opacity: [0, 1], y: [14, 0] }, { duration: 0.4, delay: (_, i) => i * 0.06 });
