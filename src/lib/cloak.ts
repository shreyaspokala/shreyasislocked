import type { CloakEntry } from '../types';

const CLOAKS: Record<string, CloakEntry> = {
  'google-docs': { title: 'Google Docs', icon: 'https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico' },
  'google-drive': { title: 'My Drive - Google Drive', icon: 'https://ssl.gstatic.com/images/branding/product/2x/drive_2020q4_48dp.png' },
  'clever': { title: 'Clever | Portal', icon: 'https://assets.clever.com/resource-icons/apps/clever.png' },
  'canvas': { title: 'Dashboard', icon: 'https://du11hjcvx0uqb.cloudfront.net/dist/images/favicon-e10d657a73.ico' },
  'gmail': { title: 'Gmail', icon: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico' },
};

export function applyCloak(): void {
  const cloak = localStorage.getItem('tabCloak');
  if (!cloak) return;
  const c = CLOAKS[cloak];
  if (!c) return;
  document.title = c.title;
  let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
  if (!link) {
    link = document.createElement('link');
    document.head.appendChild(link);
  }
  link.type = 'image/x-icon';
  link.rel = 'shortcut icon';
  link.href = c.icon;
}

export const CLOAK_KEYS = Object.keys(CLOAKS);
