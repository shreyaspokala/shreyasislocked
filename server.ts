import { createBareServer } from '@tomphttp/bare-server-node';
import http from 'node:http';
import { existsSync, statSync, createReadStream } from 'node:fs';
import { join, extname, resolve } from 'node:path';

const PORT = Number(process.env.PORT) || 3000;
const ROOT = resolve(existsSync('dist') ? 'dist' : 'public');

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.map': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

const bare = createBareServer('/bare/');

function safePath(url: string): string | null {
  const clean = decodeURIComponent(url.split('?')[0]);
  const full = resolve(join(ROOT, clean));
  if (!full.startsWith(ROOT)) return null;
  return full;
}

function serveFile(path: string, res: http.ServerResponse): void {
  const type = MIME[extname(path)] || 'application/octet-stream';
  res.writeHead(200, { 'content-type': type, 'cache-control': 'no-cache' });
  createReadStream(path).pipe(res);
}

function notFound(res: http.ServerResponse): void {
  const p = join(ROOT, '404.html');
  if (existsSync(p)) {
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    createReadStream(p).pipe(res);
  } else {
    res.writeHead(404).end('404');
  }
}

function serveStatic(req: http.IncomingMessage, res: http.ServerResponse): void {
  const url = req.url || '/';
  const p = safePath(url);
  if (!p) return notFound(res);
  if (existsSync(p) && statSync(p).isFile()) return serveFile(p, res);
  const idx = join(p, 'index.html');
  if (existsSync(idx)) return serveFile(idx, res);
  const html = p + '.html';
  if (url === '/' ) {
    const root = join(ROOT, 'index.html');
    if (existsSync(root)) return serveFile(root, res);
  }
  if (existsSync(html)) return serveFile(html, res);
  return notFound(res);
}

const server = http.createServer((req, res) => {
  if (bare.shouldRoute(req)) return bare.routeRequest(req, res);
  serveStatic(req, res);
});

server.on('upgrade', (req, sock, head) => {
  if (bare.shouldRoute(req)) bare.routeUpgrade(req, sock, head);
  else sock.end();
});

server.listen(PORT, () => {
  console.log(`Serving ${ROOT} + bare /bare/ on http://localhost:${PORT}`);
});
