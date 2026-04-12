import '../styles/style.css';
import { mountSidebar } from '../lib/sidebar';
import { initShell } from '../lib/shell';
import {
  isPasswordSet, setPassword, unlock, readHistory, clearHistory, resetAll,
  stashSessionPassword, clearSessionPassword, getSessionKey,
} from '../lib/history';
import { animate, stagger } from 'motion';

mountSidebar('history');
initShell();

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const gate = $('gate'), view = $('view');
const pw = $<HTMLInputElement>('pw'), pw2 = $<HTMLInputElement>('pw2');
const err = $('gate-err'), gateTitle = $('gate-title'), gateDesc = $('gate-desc');
const list = $('hist-list');

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

function showErr(msg: string): void { err.textContent = msg; err.hidden = false; }
function clearErr(): void { err.hidden = true; }

function setupGate(): void {
  gate.hidden = false; view.hidden = true;
  if (isPasswordSet()) {
    gateTitle.textContent = 'Unlock'; gateDesc.textContent = 'Enter password.'; pw2.hidden = true;
  } else {
    gateTitle.textContent = 'Set password'; gateDesc.textContent = 'First time: choose a password. Can\'t be recovered.'; pw2.hidden = false;
  }
  animate(gate, { opacity: [0, 1], scale: [0.94, 1], y: [20, 0] }, { duration: 0.4, easing: [0.22, 1, 0.36, 1] });
}

async function renderHistory(): Promise<void> {
  gate.hidden = true; view.hidden = false;
  const key = await getSessionKey();
  if (!key) { setupGate(); return; }
  const entries = await readHistory(key);
  list.innerHTML = entries.map((e) => `
    <div class="hist-item">
      <a class="url" href="${escape(e.url)}" target="_blank" rel="noopener">${escape(e.title || e.url)}</a>
      <span class="when">${new Date(e.at).toLocaleString()}</span>
    </div>`).join('') || '<p style="color:var(--text-secondary);padding:12px;">No history yet.</p>';
  animate(view, { opacity: [0, 1], y: [10, 0] }, { duration: 0.3 });
  const items = list.querySelectorAll<HTMLElement>('.hist-item');
  if (items.length) animate(items, { opacity: [0, 1], x: [-10, 0] }, { delay: stagger(0.02), duration: 0.3 });
}

$('unlock-btn').addEventListener('click', async () => {
  clearErr();
  const p = pw.value;
  if (!p) return showErr('Password required.');
  if (!isPasswordSet()) {
    if (p !== pw2.value) return showErr('Passwords do not match.');
    if (p.length < 4) return showErr('Too short.');
    await setPassword(p);
  }
  const key = await unlock(p);
  if (!key) {
    animate(gate, { x: [0, -8, 8, -6, 6, 0] }, { duration: 0.4 });
    return showErr('Wrong password.');
  }
  stashSessionPassword(p);
  pw.value = ''; pw2.value = '';
  await renderHistory();
});

$('reset-btn').addEventListener('click', () => {
  if (!confirm('Reset: wipe password and all history. Sure?')) return;
  resetAll(); clearSessionPassword(); setupGate();
});

$('lock-btn').addEventListener('click', () => { clearSessionPassword(); setupGate(); });
$('clear-btn').addEventListener('click', () => {
  if (!confirm('Clear history?')) return;
  clearHistory(); list.innerHTML = '';
});

pw.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('unlock-btn').click(); });
pw2.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('unlock-btn').click(); });

(async () => {
  if (await getSessionKey()) renderHistory();
  else setupGate();
})();
