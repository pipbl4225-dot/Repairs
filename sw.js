const CACHE = 'avp-v1';
const ASSETS = [
  '/Repairs/index.html',
  '/Repairs/manifest.json',
  'https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700;900&family=JetBrains+Mono:wght@400;700&display=swap'
];

// Install — cache key assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', e => {
  // Skip Google Apps Script requests — always network
  if (e.request.url.includes('script.google.com')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache successful GET responses
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Push notifications
self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'АВП Технология', {
      body: data.body || 'Новое событие',
      icon: '/Repairs/icon-192.png',
      badge: '/Repairs/icon-192.png',
      tag: data.tag || 'avp',
      data: data.url || '/Repairs/index.html',
      vibrate: [200, 100, 200],
      actions: [
        { action: 'open', title: 'Открыть' },
        { action: 'close', title: 'Закрыть' }
      ]
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action !== 'close') {
    e.waitUntil(clients.openWindow(e.notification.data || '/Repairs/index.html'));
  }
});
