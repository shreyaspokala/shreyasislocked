import { applyCloak } from './cloak';
import { wirePanic } from './panic';
import { animate } from 'motion';
import { pageEnter, revealHeader, staggerCards, wireCardHover, wireTabSwap, sidebarSlide } from './motion';

export function initShell(): void {
  const hamburger = document.querySelector<HTMLButtonElement>('.hamburger');
  const sidebar = document.querySelector<HTMLElement>('.sidebar');
  const overlay = document.querySelector<HTMLElement>('.overlay');
  if (hamburger && sidebar && overlay) {
    hamburger.addEventListener('click', () => {
      const opening = !sidebar.classList.contains('open');
      sidebar.classList.toggle('open');
      overlay.classList.toggle('open');
      if (opening) {
        animate(sidebar, { x: [-40, 0], opacity: [0, 1] }, { duration: 0.28 });
        animate(overlay, { opacity: [0, 1] }, { duration: 0.18 });
      }
    });
    overlay.addEventListener('click', () => {
      animate(sidebar, { x: [0, -40], opacity: [1, 0] }, { duration: 0.2 });
      animate(overlay, { opacity: [1, 0] }, { duration: 0.18 }).finished.then(() => {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
        (sidebar as HTMLElement).style.transform = '';
        (sidebar as HTMLElement).style.opacity = '';
        (overlay as HTMLElement).style.opacity = '';
      });
    });
  }

  wireTabSwap();
  applyCloak();
  wirePanic();

  pageEnter();
  revealHeader();
  sidebarSlide();
  queueMicrotask(() => {
    document.querySelectorAll<HTMLElement>('.tab-content.active .card-grid, .card-grid').forEach((g) => staggerCards(g));
    wireCardHover();
  });
}
