// 오프라인에서도 열리도록 캐시. 그림을 고친 뒤 배포할 때는 VERSION 숫자를 올린다.
const VERSION = 'banjjak-11';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
self.addEventListener('install', e => e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url), font = FONT_HOSTS.includes(url.hostname);
  if (url.origin !== location.origin && !font) return;
  const keep = res => {
    if (res && (res.ok || (font && res.type === 'opaque'))) { const cp = res.clone(); caches.open(VERSION).then(c => c.put(req, cp)); }
    return res;
  };
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' })
      .then(res => { if (res.ok) { const cp = res.clone(); caches.open(VERSION).then(c => c.put('./index.html', cp)); } return res; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  if (font) { // 글꼴: 저장본을 먼저 쓰고 뒤에서 새로 받아 두기
    e.respondWith(caches.match(req).then(hit => { const net = fetch(req).then(keep).catch(() => hit); return hit || net; }));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(keep)));
});
