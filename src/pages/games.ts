import '../styles/style.css';
import { mountSidebar } from '../lib/sidebar';
import { initShell } from '../lib/shell';
import { rewrite } from '../lib/cdn';
import { buildSearcher, type Searcher } from '../lib/search';
import { staggerCards, wireCardHover } from '../lib/motion';
import { basePath } from '../lib/paths';
import type { Game } from '../types';

mountSidebar('games');
initShell();

const grid = document.getElementById('game-grid') as HTMLElement;
const input = document.getElementById('game-search') as HTMLInputElement;
const count = document.getElementById('game-count') as HTMLElement;

let searcher: Searcher | null = null;

function render(items: Game[]): void {
  const html = items
    .map((g) => {
      const img = rewrite(g.image);
      const url = encodeURIComponent(g.url);
      const name = encodeURIComponent(g.name);
      const proxy = g.usesProxy ? '&proxy=1' : '';
      const media = img
        ? `<img class="card-img" loading="lazy" src="${img}" alt="" onerror="this.style.display='none'">`
        : '<span class="card-icon">\u{1F3AE}</span>';
      return `<a class="card" href="${basePath(`play.html?url=${url}&name=${name}${proxy}`)}">${media}<div class="card-title">${escapeHtml(g.name)}</div></a>`;
    })
    .join('');
  grid.innerHTML = html || '<p style="color:var(--text-secondary);padding:20px;">No matches.</p>';
  staggerCards(grid);
  wireCardHover(grid);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

let debounce: number | undefined;
input.addEventListener('input', () => {
  if (!searcher) return;
  clearTimeout(debounce);
  debounce = window.setTimeout(() => {
    const q = input.value;
    render(q ? searcher!.search(q, 300) : searcher!.all());
  }, 40);
});

(async () => {
  const res = await fetch(basePath('data/games.json'));
  const data: Game[] = await res.json();
  count.textContent = `${data.length} games`;
  searcher = await buildSearcher(data);
  render(searcher.all());
})();
