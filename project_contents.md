
### index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#9a1c20" />
    <title>The Cutting Machinery</title>
    <link rel="manifest" href="/manifest.json" />
    <link rel="stylesheet" href="/css/main.css" />
    <link
      href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap"
      rel="stylesheet"
    />
    <!-- Favicons -->
    <link rel="icon" type="image/x-icon" href="/assets/icons/favicon.ico" />
    <link
      rel="icon"
      type="image/png"
      sizes="16x16"
      href="/assets/icons/favicon-16x16.png"
    />
    <link
      rel="icon"
      type="image/png"
      sizes="32x32"
      href="/assets/icons/favicon-32x32.png"
    />
    <!-- iOS support -->
    <link rel="apple-touch-icon" href="/assets/icons/icon-192x192.png" />
    <meta name="apple-mobile-web-app-status-bar" content="#9a1c20" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
  </head>
  <body>
    <header>
      <h1>The Cutting Machinery</h1>
    </header>
    <main>
      <a href="https://thecuttingmachinery.netlify.app/" style="color: white"
        >Documentation</a
      >
      <div id="stats-container">
        <div id="streak-counter">
          Streak Days: <span id="streak-days">0</span>
        </div>
        <div id="last-updated"></div>
        <div id="streak-buttons">
          <button
            id="decrease-streak"
            aria-label="Decrease streak days"
          ></button>
          <button
            id="increase-streak"
            aria-label="Increase streak days"
          ></button>
        </div>
      </div>

      <div id="meditation-sections"></div>
    </main>

    <footer id="player-container" class="hidden">
      <div id="audio-player">
        <audio id="meditation-audio" preload="auto" playsinline></audio>
        <div id="player-controls">
          <button id="play-pause" aria-label="Play">▶</button>
          <div id="playback-info">
            <div id="meditation-title"></div>
            <div id="time-display">
              <span id="current-time">00:00</span> /
              <span id="duration">00:00</span>
            </div>
          </div>
          <div id="speed-controls">
            <button class="speed-button active" data-speed="1">1x</button>
            <button class="speed-button" data-speed="1.5">1.5x</button>
            <button class="speed-button" data-speed="2">2x</button>
            <button class="speed-button" data-speed="3">3x</button>
          </div>
        </div>
        <div id="progress-container">
          <!-- Add the range input for better control -->
          <input
            type="range"
            id="progress-slider"
            min="0"
            max="100"
            value="0"
            step="0.1"
          />
        </div>
      </div>
    </footer>

    <div id="install-prompt" class="hidden">
      <p>Install The Cutting Machinery for offline access</p>
      <button id="install-button">Install</button>
      <button id="close-prompt">Not Now</button>
    </div>

    <div id="offline-notification" class="hidden">
      <p>You are currently offline. Using cached content.</p>
    </div>

    <script src="/js/main.js"></script>
    <script>
      // Register service worker
      if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
          navigator.serviceWorker
            .register("/service-worker.js")
            .then((registration) => {
              console.log(
                "ServiceWorker registration successful with scope: ",
                registration.scope
              );
            })
            .catch((err) => {
              console.log("ServiceWorker registration failed: ", err);
            });
        });
      }

      // Add wake lock support to prevent device from sleeping during meditation
      let wakeLock = null;

      async function requestWakeLock() {
        if ("wakeLock" in navigator) {
          try {
            wakeLock = await navigator.wakeLock.request("screen");
            wakeLock.addEventListener("release", () => {
              console.log("Wake Lock was released");
            });
            console.log("Wake Lock is active");
          } catch (err) {
            console.error(
              `Failed to get Wake Lock: ${err.name}, ${err.message}`
            );
          }
        }
      }

      // Request wake lock when audio starts playing
      document
        .getElementById("meditation-audio")
        .addEventListener("play", requestWakeLock);

      // Release wake lock when audio stops
      document
        .getElementById("meditation-audio")
        .addEventListener("pause", () => {
          if (wakeLock !== null) {
            wakeLock.release().then(() => {
              wakeLock = null;
            });
          }
        });

      // Handle visibility change to re-request wake lock when returning to the tab
      document.addEventListener("visibilitychange", async () => {
        if (
          wakeLock !== null &&
          document.visibilityState === "visible" &&
          document.getElementById("meditation-audio") &&
          !document.getElementById("meditation-audio").paused
        ) {
          wakeLock = await navigator.wakeLock.request("screen");
        }
      });
    </script>
  </body>
</html>

```

### js/main.js

```js
// Data structure for meditations
const sections = [
  {
    title: "Cutting Machinery Hour",
    meditations: [
      { title: "Cutting Machinery Hour", assetName: "assets/Hour.mp3" },
    ],
  },
  {
    title: "Earlier Talks",
    meditations: [
      { title: "App Intro", assetName: "assets/01-App-Intro.mp3" },
      { title: "Pre-Flight", assetName: "assets/02-Pre-Flight.mp3" },
      { title: "Posture", assetName: "assets/03-Posture.mp3" },
      {
        title: "What's It All For",
        assetName: "assets/04-Whats-It-All-For.mp3",
      },
      { title: "How to Meditate", assetName: "assets/05-How-to-Meditate.mp3" },
      {
        title: "Why these Phases",
        assetName: "assets/06-Why-these-Phases.mp3",
      },
      {
        title: "Vinay and Lineage",
        assetName: "assets/07-Vinay-and-Lineage.mp3",
      },
      {
        title: "Bad Session Guide",
        assetName: "assets/08-Bad-Session-Guide.mp3",
      },
      { title: "Progress Guide", assetName: "assets/09-Progress-Guide.mp3" },
      { title: "Can't Meditate", assetName: "assets/10-Cant-Meditate.mp3" },
    ],
  },
  {
    title: "Intermediate Talks",
    meditations: [
      {
        title: "Nothing's Happening",
        assetName: "assets/42-Nothings-Happening.mp3",
      },
      {
        title: "Synchronicity and Magic",
        assetName: "assets/43-Sync-and-Magic.mp3",
      },
      {
        title: "Depression and Anger",
        assetName: "assets/44-Depression-and-Anger.mp3",
      },
      {
        title: "Reality and Meta-Reality",
        assetName: "assets/45-Reality-and-Meta.mp3",
      },
      { title: "Fun Stuff", assetName: "assets/46-Fun-Stuff.mp3" },
    ],
  },
  {
    title: "Individual instructions",
    meditations: [
      { title: "Instruction 1-1", assetName: "assets/00-Instruction-1-1.mp3" },
      { title: "Instruction 1-2", assetName: "assets/00-Instruction-1-2.mp3" },
      { title: "Instruction 1-3", assetName: "assets/00-Instruction-1-3.mp3" },
      { title: "Instruction 2-1", assetName: "assets/00-Instruction-2-1.mp3" },
      { title: "Instruction 2-2", assetName: "assets/00-Instruction-2-2.mp3" },
      { title: "Instruction 2-3", assetName: "assets/00-Instruction-2-3.mp3" },
      { title: "Cooldown", assetName: "assets/00-Cooldown.mp3" },
      {
        title: "Instruction Sprite",
        assetName: "assets/00-Instruction-Sprite.mp3",
      },
    ],
  },
];

// DOM Elements
const meditationSectionsEl = document.getElementById("meditation-sections");
const audioEl = document.getElementById("meditation-audio");
const playPauseBtn = document.getElementById("play-pause");
const currentTimeEl = document.getElementById("current-time");
const durationEl = document.getElementById("duration");
const progressSliderEl = document.getElementById("progress-slider");
const speedButtons = document.querySelectorAll(".speed-button");
const playerContainerEl = document.getElementById("player-container");
const streakDaysEl = document.getElementById("streak-days");
const decreaseStreakBtn = document.getElementById("decrease-streak");
const increaseStreakBtn = document.getElementById("increase-streak");
const lastUpdatedEl = document.getElementById("last-updated");
const installPromptEl = document.getElementById("install-prompt");
const installButtonEl = document.getElementById("install-button");
const closePromptButtonEl = document.getElementById("close-prompt");
const offlineNotificationEl = document.getElementById("offline-notification");

// State
let currentMeditation = null;
let deferredPrompt = null;
let streakDays = 0;
let lastUpdated = null;
let isPlaying = false;
let currentSpeed = 1;
let incrementTimer = null;
let isUserSeeking = false;

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  renderMeditationList();
  setupEventListeners();
  loadStatistics();
  setupMediaSession();
  setupOfflineDetection();
});

// Functions
function renderMeditationList() {
  // Clear the container
  meditationSectionsEl.innerHTML = "";

  // For each section
  sections.forEach((section) => {
    const sectionEl = document.createElement("div");
    sectionEl.className = "section";

    // Create section title
    const titleEl = document.createElement("h2");
    titleEl.className = "section-title";
    titleEl.textContent = section.title;
    sectionEl.appendChild(titleEl);

    // Create meditation items
    section.meditations.forEach((meditation) => {
      const meditationEl = document.createElement("div");
      meditationEl.className = "meditation-item";

      // Special case for Cutting Machinery Hour (with logo)
      if (
        section.title === "Cutting Machinery Hour" &&
        meditation.title === "Cutting Machinery Hour"
      ) {
        const logoEl = document.createElement("img");
        logoEl.src = "assets/logo.png";
        logoEl.alt = "Logo";
        meditationEl.appendChild(logoEl);
      }

      const titleTextEl = document.createElement("span");
      titleTextEl.className = "meditation-item-title";
      titleTextEl.textContent = meditation.title;
      meditationEl.appendChild(titleTextEl);

      // Add click event to play meditation
      meditationEl.addEventListener("click", () => {
        playMeditation(meditation);
      });

      sectionEl.appendChild(meditationEl);
    });

    meditationSectionsEl.appendChild(sectionEl);
  });
}

function setupEventListeners() {
  // Player controls
  playPauseBtn.addEventListener("click", togglePlayPause);

  audioEl.addEventListener("timeupdate", updateProgress);
  audioEl.addEventListener("loadedmetadata", () => {
    setDuration();
    // Show player if it was hidden
    playerContainerEl.classList.remove("hidden");
  });
  audioEl.addEventListener("ended", handleMeditationEnd);

  // Progress slider
  progressSliderEl.addEventListener("input", () => {
    isUserSeeking = true;
    const seekTime = (progressSliderEl.value / 100) * audioEl.duration;
    currentTimeEl.textContent = formatTime(seekTime);
  });

  progressSliderEl.addEventListener("change", () => {
    const seekTime = (progressSliderEl.value / 100) * audioEl.duration;
    audioEl.currentTime = seekTime;
    isUserSeeking = false;
  });

  // Speed buttons
  speedButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const speed = parseFloat(button.dataset.speed);
      setPlaybackSpeed(speed);
    });
  });

  // Streak counter buttons
  decreaseStreakBtn.addEventListener("mousedown", () => {
    updateStreak(-1);
    incrementTimer = setInterval(() => updateStreak(-1), 200);
  });

  increaseStreakBtn.addEventListener("mousedown", () => {
    updateStreak(1);
    incrementTimer = setInterval(() => updateStreak(1), 200);
  });

  // Clear interval on mouse up/leave
  [decreaseStreakBtn, increaseStreakBtn].forEach((btn) => {
    btn.addEventListener("mouseup", clearIncrementTimer);
    btn.addEventListener("mouseleave", clearIncrementTimer);
    btn.addEventListener("touchend", clearIncrementTimer);
    btn.addEventListener("touchcancel", clearIncrementTimer);
  });

  // Mobile touch support
  decreaseStreakBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    updateStreak(-1);
    incrementTimer = setInterval(() => updateStreak(-1), 200);
  });

  increaseStreakBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    updateStreak(1);
    incrementTimer = setInterval(() => updateStreak(1), 200);
  });

  // PWA installation
  if (installButtonEl) {
    installButtonEl.addEventListener("click", installPWA);
  }

  if (closePromptButtonEl) {
    closePromptButtonEl.addEventListener("click", hideInstallPrompt);
  }

  // Listen for beforeinstallprompt event
  window.addEventListener("beforeinstallprompt", (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Show the install prompt
    showInstallPrompt();
  });

  // Handle visibility change (user switching tabs/apps)
  document.addEventListener("visibilitychange", handleVisibilityChange);

  // Listen for audio errors that might affect playback
  audioEl.addEventListener("error", (e) => {
    console.error("Audio error:", e);
    isPlaying = false;
    updatePlayPauseButton();

    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "none";
    }
  });

  // Listen for stalled playback
  audioEl.addEventListener("stalled", () => {
    console.warn("Audio playback stalled");

    // Update UI but don't change isPlaying state yet
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "paused";
    }
  });

  // Listen for when audio resumes after being stalled
  audioEl.addEventListener("playing", () => {
    isPlaying = true;
    updatePlayPauseButton();

    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "playing";
    }
  });

  // Handle playback progress more actively for media session
  audioEl.addEventListener("timeupdate", () => {
    // Update progress as usual
    updateProgress();

    // Keep media session in sync with current playback
    if (isPlaying && "mediaSession" in navigator && audioEl.currentTime > 0) {
      navigator.mediaSession.playbackState = "playing";

      // Update less frequently to avoid performance issues
      if (Math.floor(audioEl.currentTime) % 5 === 0) {
        if ("setPositionState" in navigator.mediaSession) {
          navigator.mediaSession.setPositionState({
            duration: audioEl.duration || 0,
            position: audioEl.currentTime || 0,
            playbackRate: audioEl.playbackRate || 1,
          });
        }
      }
    }
  });
}

function playMeditation(meditation) {
  currentMeditation = meditation;
  document.title = `${meditation.title} - The Cutting Machinery`;

  // Set audio source
  audioEl.src = meditation.assetName;
  audioEl.load();

  // Show player if it was hidden
  playerContainerEl.classList.remove("hidden");

  // Set up media session before playing
  setupMediaSession();

  // Play after a short delay to ensure audio is loaded
  setTimeout(() => {
    const playPromise = audioEl.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          isPlaying = true;
          updatePlayPauseButton();

          // Ensure media session is updated
          if ("mediaSession" in navigator) {
            navigator.mediaSession.playbackState = "playing";
          }
        })
        .catch((error) => {
          console.error("Failed to play meditation:", error);
          isPlaying = false;
          updatePlayPauseButton();

          // Try again with user interaction if it's an autoplay policy error
          if (error.name === "NotAllowedError") {
            console.log("Autoplay prevented - waiting for user interaction");
            // Don't change UI - user will need to press play manually
          }
        });
    }
  }, 200); // Slightly longer delay for better reliability

  // Save to local storage
  localStorage.setItem(
    "lastPlayedMeditation",
    JSON.stringify({
      title: meditation.title,
      assetName: meditation.assetName,
    })
  );
}

function togglePlayPause() {
  if (!currentMeditation) return;

  if (isPlaying) {
    audioEl.pause();
    isPlaying = false;
  } else {
    audioEl
      .play()
      .then(() => {
        isPlaying = true;
      })
      .catch((error) => {
        console.error("Failed to play meditation:", error);
      });
  }

  updatePlayPauseButton();
}

function updatePlayPauseButton() {
  playPauseBtn.innerHTML = isPlaying ? "❚❚" : "▶";
  playPauseBtn.setAttribute("aria-label", isPlaying ? "Pause" : "Play");

  // Update Media Session state
  if ("mediaSession" in navigator) {
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }
}

function setDuration() {
  const duration = audioEl.duration;
  if (isNaN(duration)) return;

  durationEl.textContent = formatTime(duration);
  progressSliderEl.max = 100; // Use percentage for better compatibility
}

function updateProgress() {
  if (isUserSeeking) return; // Don't update while user is dragging slider

  const currentTime = audioEl.currentTime;
  const duration = audioEl.duration;

  if (isNaN(duration)) return;

  // Update time display
  currentTimeEl.textContent = formatTime(currentTime);

  // Update progress slider
  const progressPercent = (currentTime / duration) * 100;
  progressSliderEl.value = progressPercent;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

function setPlaybackSpeed(speed) {
  audioEl.playbackRate = speed;
  currentSpeed = speed;

  // Update active button state
  speedButtons.forEach((button) => {
    const buttonSpeed = parseFloat(button.dataset.speed);
    if (buttonSpeed === speed) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });
}

function handleMeditationEnd() {
  // Reset UI
  isPlaying = false;
  updatePlayPauseButton();

  // Update Media Session state
  if ("mediaSession" in navigator) {
    navigator.mediaSession.playbackState = "none";

    // Reset position state if supported
    if ("setPositionState" in navigator.mediaSession) {
      navigator.mediaSession.setPositionState({
        duration: 0,
        position: 0,
        playbackRate: 1,
      });
    }
  }
}

function updateStreak(change) {
  streakDays = Math.max(0, streakDays + change);
  lastUpdated = new Date();

  updateStatsDisplay();
  saveStatistics();
}

function clearIncrementTimer() {
  if (incrementTimer) {
    clearInterval(incrementTimer);
    incrementTimer = null;
  }
}

function loadStatistics() {
  // Try to load from localStorage
  const storedStats = localStorage.getItem("meditationStats");

  if (storedStats) {
    const parsedStats = JSON.parse(storedStats);
    streakDays = parsedStats.streakDays || 0;
    lastUpdated = parsedStats.lastUpdated
      ? new Date(parsedStats.lastUpdated)
      : null;
  }

  updateStatsDisplay();

  // Try to load last played meditation
  const lastPlayedMeditation = localStorage.getItem("lastPlayedMeditation");
  if (lastPlayedMeditation) {
    try {
      const meditation = JSON.parse(lastPlayedMeditation);
      // Find the meditation in our sections
      for (const section of sections) {
        for (const med of section.meditations) {
          if (med.assetName === meditation.assetName) {
            // Don't auto-play, just prepare the player
            currentMeditation = med;
            document.title = `${med.title} - The Cutting Machinery`;
            audioEl.src = med.assetName;
            audioEl.load();
            playerContainerEl.classList.remove("hidden");
            return;
          }
        }
      }
    } catch (error) {
      console.error("Failed to load last played meditation:", error);
    }
  }
}

function saveStatistics() {
  localStorage.setItem(
    "meditationStats",
    JSON.stringify({
      streakDays,
      lastUpdated: lastUpdated ? lastUpdated.toISOString() : null,
    })
  );
}

function updateStatsDisplay() {
  streakDaysEl.textContent = streakDays;

  if (lastUpdated) {
    const formattedTime = new Intl.DateTimeFormat("default", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(lastUpdated);

    lastUpdatedEl.textContent = `Last Updated: ${formattedTime}`;
  } else {
    lastUpdatedEl.textContent = "";
  }
}

function setupMediaSession() {
  if (!("mediaSession" in navigator) || !currentMeditation) return;

  // Set metadata for media session
  navigator.mediaSession.metadata = new MediaMetadata({
    title: currentMeditation.title,
    artist: "The Cutting Machinery",
    album: "Meditation App",
    artwork: [
      { src: "assets/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
      {
        src: "assets/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "assets/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  });

  // Ensure playback state is always correctly set
  navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";

  // Set position state for accurate progress tracking on lock screen
  function updatePositionState() {
    if ("setPositionState" in navigator.mediaSession) {
      navigator.mediaSession.setPositionState({
        duration: audioEl.duration || 0,
        position: audioEl.currentTime || 0,
        playbackRate: audioEl.playbackRate || 1,
      });
    }
  }

  // Update position state regularly to keep lock screen in sync
  const positionUpdateInterval = setInterval(() => {
    if (isPlaying) {
      updatePositionState();
    }
  }, 1000); // Update every second

  // Clear interval when meditation ends
  audioEl.addEventListener("ended", () => {
    clearInterval(positionUpdateInterval);
  });

  // Set action handlers
  navigator.mediaSession.setActionHandler("play", () => {
    audioEl
      .play()
      .then(() => {
        isPlaying = true;
        updatePlayPauseButton();
        navigator.mediaSession.playbackState = "playing";
        updatePositionState();
      })
      .catch((error) => {
        console.error("Media Session play error:", error);
      });
  });

  navigator.mediaSession.setActionHandler("pause", () => {
    audioEl.pause();
    isPlaying = false;
    updatePlayPauseButton();
    navigator.mediaSession.playbackState = "paused";
    updatePositionState();
  });

  navigator.mediaSession.setActionHandler("seekbackward", (details) => {
    const skipTime = details.seekOffset || 10;
    audioEl.currentTime = Math.max(audioEl.currentTime - skipTime, 0);
    updatePositionState();
  });

  navigator.mediaSession.setActionHandler("seekforward", (details) => {
    const skipTime = details.seekOffset || 10;
    audioEl.currentTime = Math.min(
      audioEl.currentTime + skipTime,
      audioEl.duration
    );
    updatePositionState();
  });

  navigator.mediaSession.setActionHandler("seekto", (details) => {
    if (details.fastSeek && "fastSeek" in audioEl) {
      audioEl.fastSeek(details.seekTime);
    } else {
      audioEl.currentTime = details.seekTime;
    }
    updatePositionState();
  });

  // Previous track handler (restart current track)
  navigator.mediaSession.setActionHandler("previoustrack", () => {
    audioEl.currentTime = 0;
    updatePositionState();
  });

  // Next track handler (we don't have playlists yet, so do nothing)
  navigator.mediaSession.setActionHandler("nexttrack", null);

  // Also update these event listeners to keep media session in sync
  audioEl.addEventListener("play", () => {
    navigator.mediaSession.playbackState = "playing";
    updatePositionState();
  });

  audioEl.addEventListener("pause", () => {
    navigator.mediaSession.playbackState = "paused";
    updatePositionState();
  });

  audioEl.addEventListener("timeupdate", () => {
    // Only update occasionally to avoid performance issues
    if (audioEl.currentTime % 5 < 0.1) {
      // Update roughly every 5 seconds
      updatePositionState();
    }
  });
}

function handleVisibilityChange() {
  // If the page becomes visible again, we should update the UI
  if (!document.hidden && currentMeditation) {
    updatePlayPauseButton();
    updateProgress();
  }
}

function showInstallPrompt() {
  // Only show if we have the deferred prompt and user hasn't dismissed it
  if (deferredPrompt && !localStorage.getItem("installPromptDismissed")) {
    installPromptEl.classList.remove("hidden");
  }
}

function hideInstallPrompt() {
  if (installPromptEl) {
    installPromptEl.classList.add("hidden");
    localStorage.setItem("installPromptDismissed", "true");
  }
}

async function installPWA() {
  if (!deferredPrompt) return;

  // Show the install prompt
  deferredPrompt.prompt();

  // Wait for the user to respond to the prompt
  const choiceResult = await deferredPrompt.userChoice;

  // Reset the deferred prompt variable
  deferredPrompt = null;

  // Hide our UI
  hideInstallPrompt();
}

function setupOfflineDetection() {
  // Check if currently offline
  if (!navigator.onLine) {
    showOfflineNotification();
  }

  // Add event listeners for online/offline events
  window.addEventListener("online", hideOfflineNotification);
  window.addEventListener("offline", showOfflineNotification);
}

function showOfflineNotification() {
  offlineNotificationEl.classList.remove("hidden");

  // Auto-hide after 5 seconds
  setTimeout(() => {
    offlineNotificationEl.classList.add("hidden");
  }, 5000);
}

function hideOfflineNotification() {
  offlineNotificationEl.classList.add("hidden");
}

```

### offline.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#9a1c20" />
    <title>Offline - The Cutting Machinery</title>
    <style>
      body {
        font-family: "Roboto", sans-serif;
        background-color: #9a1c20;
        color: white;
        text-align: center;
        padding: 2rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
      }

      .logo {
        width: 120px;
        height: 120px;
        margin-bottom: 2rem;
      }

      h1 {
        margin-bottom: 1rem;
        font-size: 24px;
        font-weight: 500;
      }

      p {
        margin-bottom: 2rem;
        max-width: 600px;
        line-height: 1.6;
        font-size: 18px;
      }

      button {
        background-color: transparent;
        color: white;
        border: 2px solid white;
        padding: 10px 20px;
        font-size: 16px;
        cursor: pointer;
        transition: background-color 0.3s;
      }

      button:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
    </style>
    <link
      href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <img src="/assets/logo.png" alt="The Cutting Machinery Logo" class="logo" />
    <h1>You're Offline</h1>
    <p>
      It looks like you don't have an internet connection right now. The Cutting
      Machinery app requires a connection to load initially, but your previously
      cached meditations are still available.
    </p>
    <p>
      If you've installed the app and visited while online, your meditation
      audio files should be available for offline use.
    </p>
    <button onclick="location.reload()">Try Again</button>

    <script>
      // Check if we're back online
      window.addEventListener("online", () => {
        location.reload();
      });
    </script>
  </body>
</html>

```

### service-worker.js

```js
// Service worker for The Cutting Machinery PWA
const STATIC_CACHE = "static-assets-v2"; // Version bump to force cache refresh
const AUDIO_CACHE = "audio-assets-v1"; // Separate cache for audio files that never change

// Regular assets to cache (non-audio)
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/css/main.css",
  "/js/main.js",
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

          // For document requests, return the cached index.html as fallback
          if (event.request.destination === "document") {
            return caches.match("/index.html");
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

```
