// Service worker for The Cutting Machinery PWA
const STATIC_CACHE = "static-assets-v2"; // Version bump to force cache refresh
const AUDIO_CACHE = "audio-assets-v1"; // Separate cache for audio files that never change

// Regular assets to cache (non-audio)
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/css/main.css",
  "/js/main.js",
  "/offline.html",
  "/manifest.json",
  "/assets/logo.png",
  // Add favicon files if you have them
  "/favicon.ico",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
];

// Audio files that never change
const AUDIO_ASSETS = [
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

// Install event - cache all assets
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");

  // Skip waiting to ensure the new service worker takes over immediately
  self.skipWaiting();

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log("[Service Worker] Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      }),

      // Cache audio assets with a more aggressive strategy
      // since they will never change
      caches.open(AUDIO_CACHE).then((cache) => {
        console.log("[Service Worker] Caching audio assets");
        return cache.addAll(AUDIO_ASSETS);
      }),
    ])
  );
});

// Activate event - clean up old caches but preserve audio cache
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...");

  // Take control immediately
  self.clients.claim();

  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          // Never delete the audio cache, only update the static cache
          if (key !== STATIC_CACHE && key !== AUDIO_CACHE) {
            console.log("[Service Worker] Removing old cache", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// Fetch event with optimized strategy for audio files
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Special handling for audio files
  if (event.request.url.endsWith(".mp3")) {
    event.respondWith(
      // Check the dedicated audio cache first
      caches
        .open(AUDIO_CACHE)
        .then((cache) => cache.match(event.request))
        .then((response) => {
          if (response) {
            // If audio is in cache, return it immediately
            // Add range request support for better streaming
            if (event.request.headers.has("range")) {
              return handleRangeRequest(response, event.request);
            }
            return response;
          }

          console.log(
            "[Service Worker] Audio file not in cache, fetching: ",
            event.request.url
          );

          // If not in cache (shouldn't happen after install), fetch from network
          return fetch(event.request)
            .then((networkResponse) => {
              // Clone the response
              const responseToCache = networkResponse.clone();

              // Store in the audio cache
              caches.open(AUDIO_CACHE).then((cache) => {
                cache.put(event.request, responseToCache);
              });

              return networkResponse;
            })
            .catch((error) => {
              console.error(
                "[Service Worker] Failed to fetch audio file:",
                error
              );
              return new Response("Audio file not available offline", {
                status: 503,
                headers: { "Content-Type": "text/plain" },
              });
            });
        })
    );
    return; // Exit early after handling audio
  }

  // For non-audio files, use a cache-first strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached response for non-audio files
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

          // Store in the static cache
          caches.open(STATIC_CACHE).then((cache) => {
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
        });
    })
  );
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

// Helper function to handle range requests for better audio streaming
async function handleRangeRequest(response, request) {
  const rangeHeader = request.headers.get("range");
  if (!rangeHeader) return response;

  const arrayBuffer = await response.arrayBuffer();
  const bytes = /^bytes=(\d+)-(\d+)?$/g.exec(rangeHeader);

  if (!bytes) return response;

  const start = parseInt(bytes[1], 10);
  const end = bytes[2] ? parseInt(bytes[2], 10) : arrayBuffer.byteLength - 1;
  const contentLength = end - start + 1;

  const headers = new Headers({
    "Content-Type": response.headers.get("Content-Type"),
    "Content-Length": contentLength,
    "Content-Range": `bytes ${start}-${end}/${arrayBuffer.byteLength}`,
    "Accept-Ranges": "bytes",
  });

  return new Response(arrayBuffer.slice(start, end + 1), {
    status: 206,
    statusText: "Partial Content",
    headers,
  });
}
