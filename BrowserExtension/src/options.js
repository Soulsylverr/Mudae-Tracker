const DEFAULTS = {
  endpointUrl: "",
  botId: "432610292342587392",
  authToken: ""
};

function $(id) {
  return document.getElementById(id);
}

async function load() {
  const stored = await chrome.storage.sync.get(DEFAULTS);
  $("endpointUrl").value = stored.endpointUrl || "";
  $("botId").value = stored.botId || DEFAULTS.botId;
  $("authToken").value = stored.authToken || "";
}

async function save() {
  const endpointUrl = $("endpointUrl").value.trim();
  const botId = $("botId").value.trim() || DEFAULTS.botId;
  const authToken = $("authToken").value.trim();

  await chrome.storage.sync.set({ endpointUrl, botId, authToken });
  $("status").textContent = "Saved.";
  setTimeout(() => ($("status").textContent = ""), 1500);
}

document.addEventListener("DOMContentLoaded", () => {
  load().catch((e) => {
    console.error("Options load failed:", e);
    $("status").textContent = "Failed to load options.";
  });

  $("save").addEventListener("click", () => {
    save().catch((e) => {
      console.error("Options save failed:", e);
      $("status").textContent = "Failed to save.";
    });
  });
});

