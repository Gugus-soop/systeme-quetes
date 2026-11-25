/* Service worker du Système : met tout en cache pour fonctionner hors ligne. */
const VERSION = 'systeme-__VERSION__'
const PRECACHE = __PRECACHE__

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  // Supprime les anciennes versions du cache.
  event.waitUntil(
    caches
      .keys()
      .then((cles) => Promise.all(cles.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return

  // Pages : réseau d'abord (pour avoir les mises à jour), cache si hors ligne.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((rep) => {
          const copie = rep.clone()
          caches.open(VERSION).then((c) => c.put('./index.html', copie))
          return rep
        })
        .catch(() => caches.match('./index.html')),
    )
    return
  }

  // Fichiers (JS, CSS, polices, icônes) : cache d'abord.
  event.respondWith(
    caches.match(req).then(
      (enCache) =>
        enCache ||
        fetch(req).then((rep) => {
          if (rep.ok) {
            const copie = rep.clone()
            caches.open(VERSION).then((c) => c.put(req, copie))
          }
          return rep
        }),
    ),
  )
})
