import { cpSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const copies: [string, string][] = [
  ['node_modules/@titaniumnetwork-dev/ultraviolet/dist', 'public/uv'],
  ['node_modules/@mercuryworkshop/bare-mux/dist', 'public/baremux'],
  ['node_modules/@mercuryworkshop/bare-as-module3/dist', 'public/baretransport'],
];

for (const [src, dst] of copies) {
  if (!existsSync(src)) {
    console.error('missing', src);
    process.exit(1);
  }
  mkdirSync(dst, { recursive: true });
  cpSync(src, dst, { recursive: true });
  console.log('copied', src, '->', dst);
}

// Ensure our customized uv config + sw stay (overwrite-safe)
const customUvConfig = `/*global Ultraviolet*/
self.__uv$config = {
    prefix: '/uv/service/',
    bare: '/bare/',
    encodeUrl: Ultraviolet.codec.xor.encode,
    decodeUrl: Ultraviolet.codec.xor.decode,
    handler: '/uv/uv.handler.js',
    client: '/uv/uv.client.js',
    bundle: '/uv/uv.bundle.js',
    config: '/uv/uv.config.js',
    sw: '/uv/uv.sw.js',
};
`;
const customUvSw = `/*global UVServiceWorker,__uv$config,BareMux*/
importScripts('/baremux/bare.cjs');
importScripts('/uv/uv.bundle.js');
importScripts('/uv/uv.config.js');
importScripts(__uv$config.sw || '/uv/uv.sw.js');

const uv = new UVServiceWorker();

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  event.respondWith((async () => {
    if (uv.route(event)) return await uv.fetch(event);
    return fetch(event.request);
  })());
});
`;

await Bun.write(join('public', 'uv', 'uv.config.js'), customUvConfig);
await Bun.write(join('public', 'uv', 'sw.js'), customUvSw);

// bare-mux ships its index as index.js — rename a copy to bare.cjs for importScripts
const muxIndex = 'public/baremux/index.js';
if (existsSync(muxIndex)) {
  cpSync(muxIndex, 'public/baremux/bare.cjs');
}
console.log('deps copy complete');
