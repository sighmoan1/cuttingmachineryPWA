const CACHE_NAME = "cutting-machinery-v1";

// All assets to cache (app shell and meditation audio files)
const ASSETS_TO_CACHE = [
  // App shell assets
  "/",
  "/index.html",
  "/css/main.css",
  "/js/main.js",
  "/offline.html",
  "/manifest.json",
  "/assets/logo.png",
  // Meditation audio files
  "/assets/Hour.mp3",
  "/assets/01-App-Intro.mp3",
  "/assets/02-Pre-Flight.mp3",
  "/assets/03-Posture.mp3",
  "/assets/04-Whats-It-All-For.mp3",
  "/assets/05-How-to-Meditate.mp3",
  "/assets/06-Why-these-Phases.mp3",
  "/assets/07-Vinay-and-Lineage.mp3",
  "/assets/08-Bad-Session-Guide.mp3",
  "/assets/09-Progress-Guide.mp3",
  "/assets/10-Cant-Meditate.mp3",
  "/assets/42-Nothings-Happening.mp3",
  "/assets/43-Sync-and-Magic.mp3",
  "/assets/44-Depression-and-Anger.mp3",
  "/assets/45-Reality-and-Meta.mp3",
  "/assets/46-Fun-Stuff.mp3",
];

// Install event: pre-cache everything.
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing and pre-caching assets...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
      .catch((error) =>
        console.error("[Service Worker] Failed to pre-cache:", error)
      )
  );
});

// Activate event: clean up any old caches.
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...");
  event.waitUntil(
    caches
      .keys()
      .then((keyList) => {
        return Promise.all(
          keyList.map((key) => {
            if (key !== CACHE_NAME) {
              console.log("[Service Worker] Removing old cache:", key);
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event: serve assets from cache first.
self.addEventListener("fetch", (event) => {
  // Only handle same-origin requests.
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return (
          cachedResponse ||
          fetch(event.request)
            .then((response) => {
              // Optionally update the cache here if desired.
              return response;
            })
            .catch((error) => {
              console.error("[Service Worker] Fetch failed:", error);
              if (event.request.destination === "document") {
                return caches.match("/offline.html");
              }
            })
        );
      })
    );
  }
});
