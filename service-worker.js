// Service worker for The Cutting Machinery PWA
const CACHE_NAME = "cutting-machinery-v1";
const ASSETS_CACHE = "assets-cache";

// Assets to cache during installation
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/css/main.css",
  "/js/main.js",
  "/offline.html",
  "/manifest.json",
  "/assets/logo.png",
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
  "/assets/00-Instruction-1-1.mp3",
  "/assets/00-Instruction-1-2.mp3",
  "/assets/00-Instruction-1-3.mp3",
  "/assets/00-Instruction-2-1.mp3",
  "/assets/00-Instruction-2-2.mp3",
  "/assets/00-Instruction-2-3.mp3",
  "/assets/00-Cooldown.mp3",
  "/assets/00-Instruction-Sprite.mp3",
];

// Install event - cache all static assets
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Caching app assets");
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...");

  event.waitUntil(
    caches
      .keys()
      .then((keyList) => {
        return Promise.all(
          keyList.map((key) => {
            if (key !== CACHE_NAME && key !== ASSETS_CACHE) {
              console.log("[Service Worker] Removing old cache", key);
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );

  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached response
          return cachedResponse;
        }

        // If not in cache, fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache if response is not valid
            if (
              !response ||
              response.status !== 200 ||
              response.type !== "basic"
            ) {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Open cache and store response
            caches.open(ASSETS_CACHE).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return response;
          })
          .catch((error) => {
            console.log("[Service Worker] Fetch failed:", error);

            // Return offline page for document requests
            if (event.request.destination === "document") {
              return caches.match("/offline.html");
            }

            // For audio files, provide some fallback or error message
            if (event.request.url.endsWith(".mp3")) {
              // Return an appropriate error response
              return new Response("Audio file not available offline", {
                status: 503,
                headers: { "Content-Type": "text/plain" },
              });
            }
          });
      })
    );
  }
});

// Handle background sync
self.addEventListener("sync", (event) => {
  console.log("[Service Worker] Sync event", event.tag);

  if (event.tag === "sync-meditation-data") {
    event.waitUntil(syncMeditationData());
  }
});

// Function to sync data with server when online
async function syncMeditationData() {
  // Get data from localStorage that needs to be synced
  const clients = await self.clients.matchAll();

  if (clients && clients.length > 0) {
    clients[0].postMessage({
      type: "SYNC_COMPLETE",
    });
  }
}

// Push notification event
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push received", event);

  const title = "The Cutting Machinery";
  const options = {
    body: event.data ? event.data.text() : "Time for your meditation practice",
    icon: "/assets/icons/icon-192x192.png",
    badge: "/assets/icons/badge-72x72.png",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification click");

  event.notification.close();

  event.waitUntil(clients.openWindow("/"));
});
