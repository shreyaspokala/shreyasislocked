import '../styles/style.css';
import { mountSidebar } from '../lib/sidebar';
import { initShell } from '../lib/shell';

mountSidebar('emulator');
initShell();

declare global {
  interface Window {
    EJS_player: string;
    EJS_core: string;
    EJS_gameUrl: string;
    EJS_pathtodata: string;
    EJS_startOnLoaded: boolean;
    EJS_gameName?: string;
  }
}

const fileInput = document.getElementById('rom-file') as HTMLInputElement;
const coreSel = document.getElementById('core') as HTMLSelectElement;
const gameDiv = document.getElementById('game') as HTMLElement;

fileInput.addEventListener('change', () => {
  const f = fileInput.files?.[0];
  if (!f) return;
  const url = URL.createObjectURL(f);
  gameDiv.innerHTML = '';
  window.EJS_player = '#game';
  window.EJS_core = coreSel.value;
  window.EJS_gameUrl = url;
  window.EJS_gameName = f.name;
  window.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';
  window.EJS_startOnLoaded = true;
  const s = document.createElement('script');
  s.src = 'https://cdn.emulatorjs.org/stable/data/loader.js';
  document.body.appendChild(s);
});

document.getElementById('fs-btn')?.addEventListener('click', () => gameDiv.requestFullscreen());
