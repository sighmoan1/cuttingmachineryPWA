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

// Media assets (larger files)
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

// Cache meditations with progress tracking
function cacheMediaAssets() {
  return caches.open(MEDIA_CACHE_NAME).then((cache) => {
    console.log("[Service Worker] Caching meditation files");

    // Create an array of promises for each asset
    const mediaPromises = MEDIA_ASSETS.map((url) => {
      return fetch(url)
        .then((response) => {
          if (!response || response.status !== 200) {
            throw new Error(`Failed to fetch: ${url}`);
          }
          return cache.put(url, response);
        })
        .then(() => {
          // Update progress in IndexedDB or postMessage to client
          return self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage({
                type: "CACHE_PROGRESS",
                url: url,
                total: MEDIA_ASSETS.length,
              });
            });
          });
        })
        .catch((error) => {
          console.error(`[Service Worker] Failed to cache: ${url}`, error);
          // Continue with other files even if one fails
          return Promise.resolve();
        });
    });

    return Promise.all(mediaPromises);
  });
}

// Install event - cache core app files
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
        // Don't wait for media caching to finish installation
        // This way the app becomes usable faster
        self.skipWaiting();

        // Start caching media files in the background
        cacheMediaAssets();
      })
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

// Handle messages from clients
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CACHE_ALL_MEDITATIONS") {
    // Manually trigger caching of all meditation files
    event.waitUntil(
      cacheMediaAssets().then(() => {
        // Notify client when complete
        event.source.postMessage({
          type: "CACHE_COMPLETE",
        });
      })
    );
  }
});

// Fetch event - serve from cache or network
self.addEventListener("fetch", (event) => {
  // Only handle same-origin requests
  if (event.request.url.startsWith(self.location.origin)) {
    // Check if request is for media file
    const isMediaRequest = MEDIA_ASSETS.some((asset) =>
      event.request.url.includes(asset.substring(1))
    );

    event.respondWith(
      // Try both caches
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // If found in any cache, return it
          return cachedResponse;
        }

        // If not in cache, try fetching from network
        return fetch(event.request)
          .then((response) => {
            // Validate response
            if (
              !response ||
              response.status !== 200 ||
              response.type !== "basic"
            ) {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Store in appropriate cache based on request type
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

            // Serve offline.html for document requests
            if (event.request.destination === "document") {
              return caches.match("/offline.html");
            }
          });
      })
    );
  }
});
