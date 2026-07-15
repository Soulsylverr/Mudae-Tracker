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

async function test() {
  $("status").textContent = "Testing…";
  const res = await chrome.runtime.sendMessage({ type: "MUDAE_TEST_ENDPOINT" });
  $("status").textContent = res?.ok ? "Test OK." : `Test failed: ${res?.status || 0} ${res?.text || ""}`.trim();
}

async function manualTrigger() {
  const userId = $("manualUserId").value.trim();
  if (!userId) {
    $("manualStatus").textContent = "Please enter your Discord user ID.";
    return;
  }
  if (!/^\d{15,20}$/.test(userId)) {
    $("manualStatus").textContent = "Invalid Discord user ID format.";
    return;
  }

  $("manualStatus").textContent = "Sending…";
  const stored = await chrome.storage.sync.get(DEFAULTS);
  const event = {
    source: "manual",
    botId: String(stored.botId || DEFAULTS.botId),
    discordUserId: String(userId),
    votedAt: Date.now(),
    pageUrl: "manual://trigger"
  };

  const res = await chrome.runtime.sendMessage({ type: "MUDAE_VOTE_EVENT", event });
  $("manualStatus").textContent = res?.ok ? "Vote triggered successfully." : `Failed: ${res?.status || 0} ${res?.text || ""}`.trim();
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

  $("test").addEventListener("click", () => {
    test().catch((e) => {
      console.error("Options test failed:", e);
      $("status").textContent = `Test failed: ${String(e?.message || e)}`;
    });
  });

  $("manualTrigger").addEventListener("click", () => {
    manualTrigger().catch((e) => {
      console.error("Manual trigger failed:", e);
      $("manualStatus").textContent = `Failed: ${String(e?.message || e)}`;
    });
  });
});

