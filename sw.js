/* Update the study home immediately; retain audio and the shell for offline use. */
var CACHE = 'jft1-v6-listening-scripts';
var SHELL = ['./', './index.html', './exam-lab.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', function (event) {
 event.waitUntil(caches.open(CACHE).then(function (cache) {
  return Promise.all(SHELL.map(function (url) { return cache.add(url).catch(function () {}); }));
 }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (event) {
 event.waitUntil(caches.keys().then(function (keys) {
  return Promise.all(keys.map(function (key) { return key !== CACHE && key.startsWith('jft1-') ? caches.delete(key) : null; }));
 }).then(function () { return self.clients.claim(); }));
});
function remember(request, response) {
 if (response && response.ok) {
  var copy = response.clone();
  caches.open(CACHE).then(function (cache) { return cache.put(request, copy); }).catch(function () {});
 }
 return response;
}
self.addEventListener('fetch', function (event) {
 var request = event.request;
 if (request.method !== 'GET') return;
 var url = new URL(request.url);
 if (url.origin !== self.location.origin) return;
 if (request.mode === 'navigate' || /\.html$/i.test(url.pathname)) {
  event.respondWith(fetch(request).then(function (response) {
   if (!response.ok) return caches.match(request).then(function (hit) { return hit || response; });
   return remember(request, response);
  }).catch(function () { return caches.match(request).then(function (hit) { return hit || caches.match('./index.html'); }); }));
  return;
 }
 event.respondWith(caches.match(request).then(function (hit) {
  return hit || fetch(request).then(function (response) { return remember(request, response); });
 }));
});
