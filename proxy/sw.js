// Service Worker for proxy
// This is a placeholder that will be enhanced when Ultraviolet is set up with a backend

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// When Ultraviolet/Scramjet is configured, this SW will intercept
// fetch requests and route them through the proxy backend.
// For now, it passes through all requests normally.
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
