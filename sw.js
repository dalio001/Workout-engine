/* PLZ FitZone service worker: offline support for the installable app. */
var CACHE_VERSION = 'plz-fitzone-v2';
var CACHE_NAME = CACHE_VERSION;

var CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/mascot-96.png',
  './icons/favicon-48.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CORE_ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(key) {
        if (key !== CACHE_NAME) return caches.delete(key);
        return Promise.resolve(false);
      }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

function isPageRequest(request) {
  if (request.mode === 'navigate') return true;
  if (request.method !== 'GET') return false;
  var url = new URL(request.url);
  return url.pathname.endsWith('/') ||
    url.pathname.endsWith('/index.html');
}

self.addEventListener('fetch', function(event) {
  var request = event.request;
  if (request.method !== 'GET') return;
  if (isPageRequest(request)) {
    // NETWORK-FIRST for the page: a new version on Vercel shows on next
    // open when online; cache fallback keeps the app usable offline.
    event.respondWith(
      fetch(request).then(function(response) {
        var copyIndex = response.clone();
        var copyRoot = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put('./index.html', copyIndex);
          cache.put('./', copyRoot);
        }).catch(function() {});
        return response;
      }).catch(function() {
        return caches.match('./index.html').then(function(cached) {
          if (cached) return cached;
          return caches.match('./');
        });
      })
    );
  } else {
    // Cache-first for versioned/static assets (icons, manifest).
    event.respondWith(
      caches.match(request).then(function(cached) {
        if (cached) return cached;
        return fetch(request).then(function(response) {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(request, copy);
          }).catch(function() {});
          return response;
        });
      })
    );
  }
});
