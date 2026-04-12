export const CDN = 'https://cdn.jsdelivr.net/gh/55gms/55GMS@main/static';

export function rewrite(u: string | undefined): string {
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith('/')) return CDN + u;
  return CDN + '/' + u;
}
