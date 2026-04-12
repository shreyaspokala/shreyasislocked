import { rewrite } from '../lib/cdn';
import { applyCloak } from '../lib/cloak';
import { wirePanic, openInBlank } from '../lib/panic';
import { registerUV, uvEncode } from '../lib/uv';
import { logVisit } from '../lib/history';
import { basePath } from '../lib/paths';
import { animate } from 'motion';

applyCloak();
wirePanic();

const params = new URLSearchParams(location.search);
const url = params.get('url') || '';
const name = params.get('name') || 'Game';
const wantProxy = params.get('proxy') === '1' || /^https?:\/\//i.test(url);

document.title = `${name} - Play`;
(document.getElementById('game-title') as HTMLElement).textContent = name;

(async () => {
  const frame = document.getElementById('game-frame') as HTMLIFrameElement;
  let final = rewrite(url);
  const isExternal = /^https?:\/\//i.test(url);

  if (wantProxy && isExternal) {
    const backend = localStorage.getItem('proxyBackend');
    if (backend) {
      final = `${backend}/proxy?url=${encodeURIComponent(url)}`;
    } else {
      try {
        await registerUV();
        final = uvEncode(url);
      } catch {
        // fallback direct (may be blocked by X-Frame-Options)
      }
    }
    logVisit(url, name).catch(() => {});
  }
  frame.src = final;
  animate('.play-bar', { y: [-30, 0], opacity: [0, 1] }, { duration: 0.35 });
  animate(frame, { opacity: [0, 1], scale: [0.98, 1] }, { duration: 0.5, delay: 0.1 });
})();

document.getElementById('back-btn')?.addEventListener('click', () => {
  if (history.length > 1) history.back();
  else location.href = basePath('games.html');
});
document.getElementById('fs-btn')?.addEventListener('click', () => {
  document.getElementById('game-frame')?.requestFullscreen();
});
document.getElementById('blank-btn')?.addEventListener('click', openInBlank);
