// Request persistent storage to minimize eviction
async function requestPersistentStorage() {
  if (navigator.storage && navigator.storage.persist) {
    const isPersisted = await navigator.storage.persisted();
    if (!isPersisted) {
      const persisted = await navigator.storage.persist();
      console.log(
        persisted
          ? "Persistent storage granted."
          : "Persistent storage NOT granted."
      );
    } else {
      console.log("Already using persistent storage.");
    }
  }
}
requestPersistentStorage();

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

  // Register the service worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("Service Worker registered:", registration);

        // When the service worker is active, trigger caching of meditation files.
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: "CACHE_ALL_MEDITATIONS",
          });
        } else {
          navigator.serviceWorker.addEventListener("controllerchange", () => {
            navigator.serviceWorker.controller.postMessage({
              type: "CACHE_ALL_MEDITATIONS",
            });
          });
        }
      })
      .catch((error) => console.error("SW registration failed:", error));
  }
});

// Render the meditation list from sections
function renderMeditationList() {
  meditationSectionsEl.innerHTML = "";
  sections.forEach((section) => {
    const sectionEl = document.createElement("div");
    sectionEl.className = "section";

    const titleEl = document.createElement("h2");
    titleEl.className = "section-title";
    titleEl.textContent = section.title;
    sectionEl.appendChild(titleEl);

    section.meditations.forEach((meditation) => {
      const meditationEl = document.createElement("div");
      meditationEl.className = "meditation-item";

      // Special case for Cutting Machinery Hour with logo
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

      meditationEl.addEventListener("click", () => {
        playMeditation(meditation);
      });

      sectionEl.appendChild(meditationEl);
    });

    meditationSectionsEl.appendChild(sectionEl);
  });
}

// Set up various event listeners
function setupEventListeners() {
  playPauseBtn.addEventListener("click", togglePlayPause);
  audioEl.addEventListener("timeupdate", updateProgress);
  audioEl.addEventListener("loadedmetadata", () => {
    setDuration();
    playerContainerEl.classList.remove("hidden");
  });
  audioEl.addEventListener("ended", handleMeditationEnd);

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

  speedButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const speed = parseFloat(button.dataset.speed);
      setPlaybackSpeed(speed);
    });
  });

  decreaseStreakBtn.addEventListener("mousedown", () => {
    updateStreak(-1);
    incrementTimer = setInterval(() => updateStreak(-1), 200);
  });

  increaseStreakBtn.addEventListener("mousedown", () => {
    updateStreak(1);
    incrementTimer = setInterval(() => updateStreak(1), 200);
  });

  [decreaseStreakBtn, increaseStreakBtn].forEach((btn) => {
    btn.addEventListener("mouseup", clearIncrementTimer);
    btn.addEventListener("mouseleave", clearIncrementTimer);
    btn.addEventListener("touchend", clearIncrementTimer);
    btn.addEventListener("touchcancel", clearIncrementTimer);
  });

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

  if (installButtonEl) {
    installButtonEl.addEventListener("click", installPWA);
  }

  if (closePromptButtonEl) {
    closePromptButtonEl.addEventListener("click", hideInstallPrompt);
  }

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallPrompt();
  });

  document.addEventListener("visibilitychange", handleVisibilityChange);

  audioEl.addEventListener("error", (e) => {
    console.error("Audio error:", e);
    isPlaying = false;
    updatePlayPauseButton();
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "none";
    }
  });

  audioEl.addEventListener("stalled", () => {
    console.warn("Audio playback stalled");
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "paused";
    }
  });

  audioEl.addEventListener("playing", () => {
    isPlaying = true;
    updatePlayPauseButton();
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "playing";
    }
  });

  audioEl.addEventListener("timeupdate", () => {
    updateProgress();
    if (isPlaying && "mediaSession" in navigator && audioEl.currentTime > 0) {
      navigator.mediaSession.playbackState = "playing";
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

// Play a selected meditation
function playMeditation(meditation) {
  currentMeditation = meditation;
  document.title = `${meditation.title} - The Cutting Machinery`;
  audioEl.src = meditation.assetName;
  audioEl.load();
  playerContainerEl.classList.remove("hidden");
  setupMediaSession();

  setTimeout(() => {
    const playPromise = audioEl.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          isPlaying = true;
          updatePlayPauseButton();
          if ("mediaSession" in navigator) {
            navigator.mediaSession.playbackState = "playing";
          }
        })
        .catch((error) => {
          console.error("Failed to play meditation:", error);
          isPlaying = false;
          updatePlayPauseButton();
          if (error.name === "NotAllowedError") {
            console.log("Autoplay prevented - waiting for user interaction");
          }
        });
    }
  }, 200);

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
  if ("mediaSession" in navigator) {
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }
}

function setDuration() {
  const duration = audioEl.duration;
  if (isNaN(duration)) return;
  durationEl.textContent = formatTime(duration);
  progressSliderEl.max = 100;
}

function updateProgress() {
  if (isUserSeeking) return;
  const currentTime = audioEl.currentTime;
  const duration = audioEl.duration;
  if (isNaN(duration)) return;
  currentTimeEl.textContent = formatTime(currentTime);
  progressSliderEl.value = (currentTime / duration) * 100;
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
  speedButtons.forEach((button) => {
    const buttonSpeed = parseFloat(button.dataset.speed);
    button.classList.toggle("active", buttonSpeed === speed);
  });
}

function handleMeditationEnd() {
  isPlaying = false;
  updatePlayPauseButton();
  if ("mediaSession" in navigator) {
    navigator.mediaSession.playbackState = "none";
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
  const storedStats = localStorage.getItem("meditationStats");
  if (storedStats) {
    const parsedStats = JSON.parse(storedStats);
    streakDays = parsedStats.streakDays || 0;
    lastUpdated = parsedStats.lastUpdated
      ? new Date(parsedStats.lastUpdated)
      : null;
  }
  updateStatsDisplay();
  const lastPlayedMeditation = localStorage.getItem("lastPlayedMeditation");
  if (lastPlayedMeditation) {
    try {
      const meditation = JSON.parse(lastPlayedMeditation);
      for (const section of sections) {
        for (const med of section.meditations) {
          if (med.assetName === meditation.assetName) {
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
  navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  function updatePositionState() {
    if ("setPositionState" in navigator.mediaSession) {
      navigator.mediaSession.setPositionState({
        duration: audioEl.duration || 0,
        position: audioEl.currentTime || 0,
        playbackRate: audioEl.playbackRate || 1,
      });
    }
  }
  const positionUpdateInterval = setInterval(() => {
    if (isPlaying) updatePositionState();
  }, 1000);
  audioEl.addEventListener("ended", () => {
    clearInterval(positionUpdateInterval);
  });
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
  navigator.mediaSession.setActionHandler("previoustrack", () => {
    audioEl.currentTime = 0;
    updatePositionState();
  });
  navigator.mediaSession.setActionHandler("nexttrack", null);
  audioEl.addEventListener("play", () => {
    navigator.mediaSession.playbackState = "playing";
    updatePositionState();
  });
  audioEl.addEventListener("pause", () => {
    navigator.mediaSession.playbackState = "paused";
    updatePositionState();
  });
  audioEl.addEventListener("timeupdate", () => {
    if (audioEl.currentTime % 5 < 0.1) updatePositionState();
  });
}

function handleVisibilityChange() {
  if (!document.hidden && currentMeditation) {
    updatePlayPauseButton();
    updateProgress();
  }
}

function showInstallPrompt() {
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
  deferredPrompt.prompt();
  const choiceResult = await deferredPrompt.userChoice;
  deferredPrompt = null;
  hideInstallPrompt();
}

function setupOfflineDetection() {
  if (!navigator.onLine) showOfflineNotification();
  window.addEventListener("online", hideOfflineNotification);
  window.addEventListener("offline", showOfflineNotification);
}

function showOfflineNotification() {
  offlineNotificationEl.classList.remove("hidden");
  setTimeout(() => {
    offlineNotificationEl.classList.add("hidden");
  }, 5000);
}

function hideOfflineNotification() {
  offlineNotificationEl.classList.add("hidden");
}
