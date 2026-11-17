/* NOLA HEALTH service worker: cache-first app shell for full offline use. AI API calls are never cached. */
const CACHE = 'nola-health-v3.0.0';
const SHELL = ['./', './index.html', './manifest.webmanifest', './css/app.css', './js/i18n.js', './js/i18n2.js', './js/i18n3.js', './js/locales.js', './js/foods.js', './js/crypto.js', './js/db.js', './js/engine.js', './js/score.js', './js/coach.js', './js/ai.js', './js/charts.js', './js/planner.js', './js/insights.js', './js/academy.js', './js/nola.js', './js/voice.js', './js/share.js', './vendor/qrcode.min.js', './js/app.js', './js/features.js', './js/v3.js', './fonts/noto-ethiopic-regular.woff2', './fonts/noto-ethiopic-bold.woff2', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // AI requests go straight to network
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match('./index.html'))));
});
self.addEventListener('notificationclick', e => { // reminder tapped: focus or open NOLA
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => { const c = cs.find(x => 'focus' in x); return c ? c.focus() : self.clients.openWindow('./#/reminders'); }));
});
