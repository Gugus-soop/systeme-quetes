/* Service worker du Système : met tout en cache pour fonctionner hors ligne. */
const VERSION = 'systeme-1795622271387'
const PRECACHE = ["./","./index.html","./manifest.webmanifest","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png","./icons/apple-touch-icon.png","./assets/orbitron-latin-500-normal-C8p1Veyw.woff2","./assets/orbitron-latin-700-normal-C2w85Zl1.woff2","./assets/orbitron-latin-900-normal-6caezjY1.woff2","./assets/inter-latin-400-normal-BOOGhInR.woff2","./assets/inter-latin-ext-400-normal-hnt3BR84.woff2","./assets/inter-latin-ext-600-normal-BnYJhD27.woff2","./assets/inter-latin-600-normal-D273HNI0.woff2","./assets/index-B6AhzICp.css","./assets/index-DqB24wU0.js"]

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
