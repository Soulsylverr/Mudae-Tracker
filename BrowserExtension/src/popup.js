const DEFAULTS = {
  botId: "432610292342587392"
};

function $(id) {
  return document.getElementById(id);
}

function fmt(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

async function load() {
  const sync = await chrome.storage.sync.get(DEFAULTS);
  const local = await chrome.storage.local.get({
    lastDetectedDiscordUserId: null,
    lastVoteSentAt: null,
    lastVoteSendError: null
  });

  $("uid").textContent = local.lastDetectedDiscordUserId || "—";
  $("lastVote").textContent = fmt(local.lastVoteSentAt);

  const hint = [];
  if (!local.lastDetectedDiscordUserId) {
    hint.push("Open a top.gg page while logged in to detect your Discord user ID.");
  }
  if (local.lastVoteSendError) {
    hint.push(`Last send error: ${local.lastVoteSendError}`);
  }
  $("hint").textContent = hint.join(" ");

  $("openVote").addEventListener("click", async () => {
    const url = `https://top.gg/bot/${sync.botId}/vote`;
    await chrome.tabs.create({ url });
    window.close();
  });
  $("openOptions").addEventListener("click", async () => {
    await chrome.runtime.openOptionsPage();
    window.close();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  load().catch((e) => {
    console.error("Popup load failed:", e);
  });
});

