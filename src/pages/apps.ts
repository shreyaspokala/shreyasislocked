import '../styles/style.css';
import { mountSidebar } from '../lib/sidebar';
import { initShell } from '../lib/shell';
import { rewrite } from '../lib/cdn';
import { buildSearcher, type Searcher } from '../lib/search';
import { staggerCards, wireCardHover } from '../lib/motion';
import type { App, Game } from '../types';

mountSidebar('apps');
initShell();

const grid = document.getElementById('app-grid') as HTMLElement;
const input = document.getElementById('app-search') as HTMLInputElement;
const count = document.getElementById('app-count') as HTMLElement;

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

function render(items: App[]): void {
  grid.innerHTML = items
    .map((a) => {
      const img = rewrite(a.image);
      const url = encodeURIComponent(a.url);
      const name = encodeURIComponent(a.name);
      return `<a class="card" href="/play.html?url=${url}&name=${name}&proxy=1">${
        img ? `<img class="card-img" loading="lazy" src="${img}" alt="" onerror="this.style.display='none'">` : '<span class="card-icon">\u{1F4F1}</span>'
      }<div class="card-title">${escapeHtml(a.name)}</div></a>`;
    })
    .join('') || '<p style="color:var(--text-secondary);padding:20px;">No matches.</p>';
  staggerCards(grid);
  wireCardHover(grid);
}

let searcher: Searcher | null = null;
let debounce: number | undefined;
input.addEventListener('input', () => {
  if (!searcher) return;
  clearTimeout(debounce);
  debounce = window.setTimeout(() => {
    const q = input.value;
    render((q ? searcher!.search(q, 300) : searcher!.all()) as App[]);
  }, 40);
});

(async () => {
  const res = await fetch('/data/apps.json');
  const data: App[] = await res.json();
  count.textContent = `${data.length} apps`;
  searcher = await buildSearcher(data as Game[]);
  render(data);
})();
