document.getElementById("open-display").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("display.html") });
});

document.getElementById("open-options").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

chrome.storage.sync.get({
  firebaseUrl: "https://mudaetracker-b57ce-default-rtdb.europe-west1.firebasedatabase.app",
  discordUserId: ""
}, (cfg) => {
  const status = document.getElementById("status");
  if (cfg.discordUserId) {
    status.textContent = `Configured for ${cfg.discordUserId}`;
  } else {
    status.textContent = "Set a Discord user ID in options first.";
  }
});
