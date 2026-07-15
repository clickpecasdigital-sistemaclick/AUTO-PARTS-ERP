/**
 * AutoCore ERP — Service Worker (estrutura PWA, Sprint 04).
 *
 * Escopo desta sprint: cache do "app shell" mínimo + fallback offline para
 * navegação. NÃO implementa estratégia de cache de dados de API (isso é
 * responsabilidade do TanStack Query / IndexedDB e será endereçado quando
 * os módulos de negócio precisarem de leitura offline real).
 */
const CACHE_NAME = 'autocore-erp-shell-v1';
const APP_SHELL_URLS = ['/', '/offline.html', '/favicon.svg', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then((cached) => cached || caches.match('/offline.html')),
    ),
  );
});
