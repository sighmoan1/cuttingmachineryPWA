// Request persistent storage to help ensure assets aren't evicted.
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
// Add any other DOM elements you need below...

// State
let currentMeditation = null;
let isPlaying = false;

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  renderMeditationList();
  setupEventListeners();

  // Register the service worker. It will pre-cache everything during install.
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("Service Worker registered:", registration);
      })
      .catch((error) =>
        console.error("Service Worker registration failed:", error)
      );
  }
});

// Render the meditation list
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

      // For "Cutting Machinery Hour", include the logo
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

// Set up event listeners
function setupEventListeners() {
  playPauseBtn.addEventListener("click", togglePlayPause);

  audioEl.addEventListener("timeupdate", updateProgress);
  audioEl.addEventListener("loadedmetadata", setDuration);
  audioEl.addEventListener("ended", () => {
    isPlaying = false;
    updatePlayPauseButton();
  });
}

// Play the selected meditation
function playMeditation(meditation) {
  currentMeditation = meditation;
  audioEl.src = meditation.assetName;
  audioEl.load();
  setTimeout(() => {
    audioEl
      .play()
      .then(() => {
        isPlaying = true;
        updatePlayPauseButton();
      })
      .catch((error) => console.error("Failed to play meditation:", error));
  }, 200);
}

// Toggle play/pause
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
      .catch((error) => console.error("Failed to play meditation:", error));
  }
  updatePlayPauseButton();
}

// Update play/pause button display
function updatePlayPauseButton() {
  playPauseBtn.innerHTML = isPlaying ? "❚❚" : "▶";
}

// Set duration display when metadata is loaded
function setDuration() {
  // Implement duration UI update if needed.
  durationEl.textContent = formatTime(audioEl.duration);
}

// Update the playback progress display
function updateProgress() {
  if (!audioEl.duration) return;
  currentTimeEl.textContent = formatTime(audioEl.currentTime);
  progressSliderEl.value = (audioEl.currentTime / audioEl.duration) * 100;
}

// Format seconds into MM:SS format
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}
