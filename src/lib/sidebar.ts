import { basePath } from './paths';

export function sidebar(active: string): string {
  const icons: Record<string, string> = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11.5L12 4l9 7.5"/><path d="M5 10.8V20h14v-9.2"/></svg>',
    proxy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>',
    games: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="8" width="18" height="10" rx="4"/><path d="M8 13h4M10 11v4M16 12h.01M18 14h.01"/></svg>',
    apps: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg>',
    emulator: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 9h8M8 13h5"/></svg>',
    history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/><path d="M12 8v5l3 2"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6z"/></svg>',
  };
  const links: [string, string, string, string][] = [
    ['home', basePath(''), icons.home, 'Home'],
    ['proxy', basePath('proxy.html'), icons.proxy, 'Proxy'],
    ['games', basePath('games.html'), icons.games, 'Games'],
    ['apps', basePath('apps.html'), icons.apps, 'Apps'],
    ['emulator', basePath('emulator.html'), icons.emulator, 'Emulator'],
    ['history', basePath('history.html'), icons.history, 'History'],
    ['settings', basePath('settings.html'), icons.settings, 'Settings'],
  ];
  const items = links
    .map(([id, href, icon, label]) =>
      `<li><a href="${href}"${id === active ? ' class="active"' : ''}><span class="nav-icon">${icon}</span> ${label}</a></li>`,
    )
    .join('');
  return `
  <button class="hamburger" aria-label="Menu">&#9776;</button>
  <div class="overlay"></div>
  <nav class="sidebar">
    <div class="sidebar-header">
      <h1>ShreyasIsLocked</h1>
      <div class="subtitle">Your gateway to freedom</div>
    </div>
    <ul class="nav-links">${items}</ul>
    <div class="sidebar-footer">Press <kbd>\`</kbd> to panic</div>
  </nav>`;
}

export function mountSidebar(active: string): void {
  const slot = document.getElementById('sidebar-slot');
  if (slot) slot.outerHTML = sidebar(active);
}
