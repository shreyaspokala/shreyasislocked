import '../styles/style.css';
import { mountSidebar } from '../lib/sidebar';
import { initShell } from '../lib/shell';
import { registerUV, uvEncode } from '../lib/uv';
import { logVisit } from '../lib/history';
import { animate } from 'motion';
import { fadeSwap } from '../lib/motion';

mountSidebar('proxy');
initShell();

const QUICK: [string, string][] = [
  ['TikTok', 'https://www.tiktok.com'],
  ['YouTube', 'https://www.youtube.com'],
  ['Discord', 'https://discord.com/app'],
  ['Reddit', 'https://www.reddit.com'],
  ['Twitch', 'https://www.twitch.tv'],
  ['Twitter/X', 'https://twitter.com'],
  ['Instagram', 'https://www.instagram.com'],
  ['Netflix', 'https://www.netflix.com'],
  ['Spotify', 'https://open.spotify.com'],
];

const quickEl = document.getElementById('quick-links') as HTMLElement;
quickEl.innerHTML = QUICK.map(([label, url]) => `<div class="quick-link" data-url="${url}">${label}</div>`).join('');
quickEl.addEventListener('click', (e) => {
  const t = (e.target as HTMLElement).closest<HTMLElement>('.quick-link');
  if (t?.dataset.url) go(t.dataset.url);
});

const statusEl = document.getElementById('proxy-status') as HTMLElement;
const notice = document.getElementById('setup-notice') as HTMLElement;

const externalBackend = localStorage.getItem('proxyBackend') || '';

(async () => {
  if (externalBackend) {
    statusEl.className = 'status-pill ok';
    statusEl.textContent = 'External backend configured';
    return;
  }
  try {
    await registerUV();
    statusEl.className = 'status-pill ok';
    statusEl.textContent = 'Built-in proxy ready';
    animate(statusEl, { scale: [0.8, 1.08, 1], opacity: [0, 1] }, { duration: 0.5 });
  } catch (e) {
    console.error(e);
    statusEl.className = 'status-pill bad';
    statusEl.textContent = 'Proxy unavailable (run `bun start`)';
    notice.hidden = false;
    animate(notice, { opacity: [0, 1], y: [10, 0] }, { duration: 0.4 });
  }
})();

function isUrl(s: string): boolean {
  return /^https?:\/\//i.test(s) || /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(s);
}
function normalize(s: string): string {
  s = s.trim();
  if (!/^https?:\/\//i.test(s)) {
    return isUrl(s) ? 'https://' + s : 'https://www.google.com/search?q=' + encodeURIComponent(s);
  }
  return s;
}

const frame = document.getElementById('proxy-frame') as HTMLIFrameElement;
const urlBar = document.getElementById('url-bar') as HTMLInputElement;
const searchView = document.getElementById('proxy-search') as HTMLElement;
const browseView = document.getElementById('proxy-browse') as HTMLElement;
const input = document.getElementById('proxy-input') as HTMLInputElement;

async function go(raw: string): Promise<void> {
  const target = normalize(raw);
  let src: string;
  if (externalBackend) {
    src = `${externalBackend}/proxy?url=${encodeURIComponent(target)}`;
  } else {
    await registerUV();
    src = uvEncode(target);
  }
  await fadeSwap(searchView, browseView);
  frame.src = src;
  urlBar.value = target;
  animate(frame, { opacity: [0, 1] }, { duration: 0.35 });
  logVisit(target).catch(() => {});
}
function showSearch(): void {
  fadeSwap(browseView, searchView).then(() => { frame.src = ''; });
}

document.getElementById('go-btn')?.addEventListener('click', () => input.value && go(input.value));
input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && input.value) go(input.value); });
document.getElementById('pb-go')?.addEventListener('click', () => urlBar.value && go(urlBar.value));
urlBar.addEventListener('keydown', (e) => { if (e.key === 'Enter' && urlBar.value) go(urlBar.value); });
document.getElementById('pb-home')?.addEventListener('click', showSearch);
document.getElementById('pb-back')?.addEventListener('click', () => frame.contentWindow?.history.back());
document.getElementById('pb-fwd')?.addEventListener('click', () => frame.contentWindow?.history.forward());
document.getElementById('pb-fs')?.addEventListener('click', () => frame.requestFullscreen());
