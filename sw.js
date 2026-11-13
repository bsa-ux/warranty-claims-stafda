const CACHE_NAME = 'warranty-claims-halvern-v1';
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./data/synthetic-data.js",
  "./data/synthetic-data.json",
  "./assets/favicon.svg",
  "./assets/fonts/barlow-condensed-latin-700-normal.woff2",
  "./assets/fonts/barlow-condensed-latin-800-normal.woff2",
  "./assets/fonts/barlow-latin-400-normal.woff2",
  "./assets/fonts/barlow-latin-500-normal.woff2",
  "./assets/fonts/barlow-latin-600-normal.woff2",
  "./assets/fonts/barlow-latin-700-normal.woff2",
  "./assets/fonts/ibm-plex-mono-latin-500-normal.woff2",
  "./assets/fonts/inter.woff2",
  "./assets/fonts/recursive.woff2",
  "./assets/halvern-signin.jpg",
  "./assets/icon-192.png",
  "./assets/icon-512.png"
];

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => { e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))); });
