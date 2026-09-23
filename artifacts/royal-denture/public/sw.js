/* Royal Denture — basic offline cache for static assets */
const CACHE = "royal-denture-v1"
const PRECACHE = ["/", "/index.html", "/manifest.json", "/favicon.svg", "/logo.png"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).catch(() => {})
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const req = event.request
  if (req.method !== "GET") return

  const url = new URL(req.url)
  // Never cache Firestore / Google APIs / wa.me
  if (
    url.hostname.includes("firestore.googleapis.com") ||
    url.hostname.includes("firebasestorage.googleapis.com") ||
    url.hostname.includes("googleapis.com/collect") ||
    url.hostname.includes("wa.me")
  ) {
    return
  }

  // Static assets: cache-first
  if (url.origin === self.location.origin && (url.pathname.startsWith("/assets/") || /\.(js|css|jpg|png|svg|webp|woff2)$/.test(url.pathname))) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            const clone = res.clone()
            if (res.ok) caches.open(CACHE).then((c) => c.put(req, clone))
            return res
          })
      )
    )
    return
  }

  // Navigation: network first, fall back to cache
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put("/index.html", clone))
          return res
        })
        .catch(() => caches.match("/index.html").then((r) => r || caches.match("/")))
    )
  }
})
