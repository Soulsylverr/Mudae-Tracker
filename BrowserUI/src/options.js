const DEFAULTS = {
  firebaseUrl: "https://mudaetracker-b57ce-default-rtdb.europe-west1.firebasedatabase.app",
  discordUserId: "",
  pollIntervalMs: 3000,
  anchor: "bottom-right",
  customPosition: null,
  visibility: {
    rolls: true,
    claim: true,
    dk: true,
    daily: true,
    rt: false,
    p: false,
    oh: false,
    oc: false,
    vote: true,
  },
};

const STAT_DEFS = [
  { id: "rolls", label: "Rolls" },
  { id: "claim", label: "Claim" },
  { id: "dk", label: "Daily Kakera" },
  { id: "daily", label: "Daily" },
  { id: "rt", label: "RT" },
  { id: "p", label: "Pokeslot" },
  { id: "oh", label: "Ouroharvest" },
  { id: "oc", label: "Ourochest" },
  { id: "vote", label: "Vote" },
];

async function loadSettings() {
  const saved = await chrome.storage.sync.get(DEFAULTS);
  return {
    ...DEFAULTS,
    ...saved,
    visibility: { ...DEFAULTS.visibility, ...(saved.visibility || {}) },
  };
}

async function saveSettings(settings) {
  await chrome.storage.sync.set(settings);
}

function renderToggles(visibility) {
  const grid = document.getElementById("toggle-grid");
  grid.innerHTML = STAT_DEFS.map((s) => `
    <label class="toggle-item">
      <input type="checkbox" data-stat="${s.id}" ${visibility[s.id] ? "checked" : ""} />
      ${s.label}
    </label>`).join("");
}

async function init() {
  const settings = await loadSettings();
  document.getElementById("firebase-url").value = settings.firebaseUrl || DEFAULTS.firebaseUrl;
  document.getElementById("discord-user-id").value = settings.discordUserId || "";
  document.getElementById("poll-interval").value = settings.pollIntervalMs || 3000;
  document.getElementById("anchor").value = settings.anchor || "bottom-right";
  renderToggles(settings.visibility || DEFAULTS.visibility);

  document.getElementById("save").addEventListener("click", async () => {
    const next = {
      ...settings,
      firebaseUrl: document.getElementById("firebase-url").value.trim() || DEFAULTS.firebaseUrl,
      discordUserId: document.getElementById("discord-user-id").value.trim(),
      pollIntervalMs: Number(document.getElementById("poll-interval").value) || 3000,
      anchor: document.getElementById("anchor").value,
      visibility: { ...settings.visibility },
    };
    document.querySelectorAll("[data-stat]").forEach((input) => {
      next.visibility[input.dataset.stat] = input.checked;
    });
    await saveSettings(next);
    document.getElementById("status").textContent = "Settings saved.";
  });

  document.getElementById("refresh").addEventListener("click", () => {
    document.getElementById("status").textContent = "Refresh pending — open the display tab.";
  });

  document.getElementById("reset-position").addEventListener("click", async () => {
    const next = { ...settings, anchor: "bottom-right", customPosition: null };
    await saveSettings(next);
    document.getElementById("status").textContent = "Position reset to bottom-right.";
  });
}

init().catch(() => {});
