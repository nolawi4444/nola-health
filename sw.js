/* NOLA HEALTH service worker: offline app shell (cache-first for the shell, network-first for pages). */
const CACHE = 'nola-health-v4.0.0';
const SHELL = ['./', './index.html', './manifest.webmanifest', './css/app.css', './js/i18n.js', './js/i18n31.js', './js/i18n4.js', './js/foods.js', './js/crypto.js', './js/db.js', './js/meds.js', './js/engine.js', './js/dishes.js', './js/coach.js', './js/ai.js', './js/charts.js', './js/app.js', './fonts/noto-ethiopic-regular.woff2', './fonts/noto-ethiopic-bold.woff2', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;
  if (req.mode === 'navigate') { e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res; }).catch(() => caches.match('./index.html'))); return; }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })));
});
self.addEventListener('notificationclick', e => { e.notification.close(); e.waitUntil(self.clients.matchAll({ type: 'window' }).then(cs => cs.length ? cs[0].focus() : self.clients.openWindow('./index.html#/reminders'))); });
