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
  const endpointUrl = $("endpointUrl").value.trim();
  const authToken = $("authToken").value.trim();
  if (!endpointUrl) {
    $("status").textContent = "Set endpoint URL first.";
    return;
  }

  // Replace /vote-event with /vote-event/validate if user pasted the main endpoint.
  const url = endpointUrl.replace(/\/vote-event\/?$/, "/vote-event/validate");

  $("status").textContent = "Testing…";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(authToken ? { "x-mudae-auth": authToken } : {})
    },
    body: JSON.stringify({
      source: "topgg",
      botId: $("botId").value.trim() || DEFAULTS.botId,
      discordUserId: "0",
      votedAt: Date.now(),
      pageUrl: "https://top.gg/"
    })
  });

  const text = await res.text().catch(() => "");
  $("status").textContent = res.ok ? "Test OK." : `Test failed: ${res.status} ${text}`.trim();
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
      $("status").textContent = "Test failed.";
    });
  });
});

