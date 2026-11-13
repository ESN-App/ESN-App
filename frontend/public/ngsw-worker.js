// Kill switch for the service worker of the former Angular frontend.
//
// Browsers that visited the Angular build still have `ngsw-worker.js` registered, and that worker
// keeps serving the cached Angular app. When the browser re-checks this script it installs this
// version instead, which clears the Angular caches, unregisters itself and reloads open tabs so
// they pick up the React app (which registers its own `sw.js`). Safe to delete once old installs
// are gone.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith('ngsw:')).map((key) => caches.delete(key)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) {
        client.navigate(client.url);
      }
    })(),
  );
});
