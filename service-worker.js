const CACHE_NAME = "cutting-machinery-v1";
const MEDIA_CACHE_NAME = "cutting-machinery-media-v1";

// Essential app assets (small files)
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/css/main.css",
  "/js/main.js",
  "/offline.html",
  "/manifest.json",
  "/assets/logo.png",
];

// Media assets (meditation audio files)
const MEDIA_ASSETS = [
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

// Function to cache media assets with progress reporting
function cacheMediaAssets() {
  return caches.open(MEDIA_CACHE_NAME).then((cache) => {
    console.log("[Service Worker] Caching meditation files");
    const mediaPromises = MEDIA_ASSETS.map((url, index) => {
      return fetch(url)
        .then((response) => {
          if (!response || response.status !== 200) {
            throw new Error(`Failed to fetch: ${url}`);
          }
          return cache.put(url, response);
        })
        .then(() => {
          return self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage({
                type: "CACHE_PROGRESS",
                url: url,
                completed: index + 1,
                total: MEDIA_ASSETS.length,
              });
            });
          });
        })
        .catch((error) => {
          console.error(`[Service Worker] Failed to cache: ${url}`, error);
          return Promise.resolve();
        });
    });
    return Promise.all(mediaPromises);
  });
}

// Install event: cache the app shell immediately.
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Caching app assets");
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        self.skipWaiting();
        // Start caching media files in the background.
        cacheMediaAssets();
      })
  );
});

// Activate event: clean up old caches.
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...");
  event.waitUntil(
    caches
      .keys()
      .then((keyList) => {
        return Promise.all(
          keyList.map((key) => {
            if (key !== CACHE_NAME && key !== MEDIA_CACHE_NAME) {
              console.log("[Service Worker] Removing old cache", key);
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Listen for messages from clients.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CACHE_ALL_MEDITATIONS") {
    event.waitUntil(
      cacheMediaAssets().then(() => {
        event.source.postMessage({
          type: "CACHE_COMPLETE",
        });
      })
    );
  }
});

// Fetch event: serve from cache first, then network.
self.addEventListener("fetch", (event) => {
  if (event.request.url.startsWith(self.location.origin)) {
    const isMediaRequest = MEDIA_ASSETS.some((asset) =>
      event.request.url.includes(asset.substring(1))
    );
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request)
          .then((response) => {
            if (
              !response ||
              response.status !== 200 ||
              response.type !== "basic"
            ) {
              return response;
            }
            const responseToCache = response.clone();
            if (isMediaRequest) {
              caches.open(MEDIA_CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            } else {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return response;
          })
          .catch((error) => {
            console.log("[Service Worker] Fetch failed:", error);
            if (event.request.destination === "document") {
              return caches.match("/offline.html");
            }
          });
      })
    );
  }
});
