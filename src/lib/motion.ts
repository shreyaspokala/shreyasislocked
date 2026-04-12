import { animate, stagger, inView, hover, press, spring } from 'motion';

export const springOut = { type: 'spring', stiffness: 400, damping: 30 } as const;

export function pageEnter(selector = '.main'): void {
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return;
  animate(el, { opacity: [0, 1], y: [12, 0] }, { duration: 0.35, easing: [0.22, 1, 0.36, 1] });
}

export function revealHeader(): void {
  const h = document.querySelector('.page-header') as HTMLElement | null;
  if (!h) return;
  animate(h, { opacity: [0, 1], y: [-10, 0] }, { duration: 0.4, delay: 0.05 });
}

export function staggerCards(container: ParentNode = document): void {
  const cards = container.querySelectorAll<HTMLElement>('.card');
  if (!cards.length) return;
  animate(
    cards,
    { opacity: [0, 1], y: [16, 0], scale: [0.96, 1] },
    { delay: stagger(0.03, { startDelay: 0.05 }), duration: 0.45, easing: [0.22, 1, 0.36, 1] },
  );
}

export function wireCardHover(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('.card').forEach((card) => {
    hover(card, (el) => {
      animate(el, { scale: 1.035, y: -4 }, { type: spring, stiffness: 420, damping: 22 });
      return () => animate(el, { scale: 1, y: 0 }, { type: spring, stiffness: 320, damping: 26 });
    });
    press(card, (el) => {
      animate(el, { scale: 0.97 }, { duration: 0.12 });
      return () => animate(el, { scale: 1 }, { type: spring, stiffness: 500, damping: 20 });
    });
  });
}

export function sidebarSlide(): void {
  const s = document.querySelector('.sidebar') as HTMLElement | null;
  if (!s || window.innerWidth > 768) return;
  animate(s, { x: [-40, 0], opacity: [0, 1] }, { duration: 0.35 });
}

export function fadeSwap(from: HTMLElement, to: HTMLElement): Promise<void> {
  return new Promise((res) => {
    animate(from, { opacity: [1, 0], y: [0, -8] }, { duration: 0.18 }).finished.then(() => {
      from.style.display = 'none';
      to.style.display = '';
      animate(to, { opacity: [0, 1], y: [8, 0] }, { duration: 0.22 }).finished.then(() => res());
    });
  });
}

export function wireTabSwap(): void {
  document.querySelectorAll<HTMLButtonElement>('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      const container = btn.closest<HTMLElement>('.tabs-container');
      if (!target || !container) return;
      const next = container.querySelector<HTMLElement>(`#tab-${target}`);
      if (!next || next.classList.contains('active')) return;
      const current = container.querySelector<HTMLElement>('.tab-content.active');
      container.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      if (current && current !== next) {
        animate(current, { opacity: [1, 0], y: [0, -6] }, { duration: 0.15 }).finished.then(() => {
          current.classList.remove('active');
          next.classList.add('active');
          animate(next, { opacity: [0, 1], y: [8, 0] }, { duration: 0.22 });
          staggerCards(next);
        });
      } else {
        next.classList.add('active');
        animate(next, { opacity: [0, 1], y: [8, 0] }, { duration: 0.22 });
        staggerCards(next);
      }
    });
  });
}

export function mountInView(): void {
  inView('.card-grid', (entry) => {
    staggerCards(entry.target);
  });
}

export { animate, inView, stagger };
