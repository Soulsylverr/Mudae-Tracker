const DEFAULTS = {
  endpointUrl: "",
  botId: "432610292342587392",
  authToken: ""
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getConfig() {
  return await chrome.storage.sync.get(DEFAULTS);
}

async function postJson(url, body, authToken) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(authToken ? { "x-mudae-auth": authToken } : {})
    },
    body: JSON.stringify(body)
  });
  return { ok: res.ok, status: res.status, text: await res.text().catch(() => "") };
}

async function sendVoteEvent(event) {
  const { endpointUrl, authToken } = await getConfig();
  if (!endpointUrl) {
    return { ok: false, status: 0, text: "endpointUrl not configured" };
  }

  // Simple retry with backoff; prevents missing events due to transient network issues.
  const attempts = 5;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await postJson(endpointUrl, event, authToken);
      if (res.ok) return res;
      // If the server explicitly rejects, don't hammer it too hard.
      await sleep(400 * (i + 1));
    } catch (e) {
      await sleep(400 * (i + 1));
    }
  }
  return { ok: false, status: 0, text: "all retries failed" };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "MUDAE_USER_DETECTED" && msg.discordUserId) {
    chrome.storage.local
      .set({
        lastDetectedDiscordUserId: String(msg.discordUserId),
        lastDetectedAt: Date.now()
      })
      .catch(() => {});
    sendResponse({ ok: true });
    return;
  }

  if (!msg || msg.type !== "MUDAE_VOTE_EVENT") return;

  sendVoteEvent(msg.event)
    .then(async (res) => {
      if (res.ok) {
        await chrome.storage.local.set({
          lastVoteSentAt: Date.now(),
          lastVoteSendError: null
        });
      } else {
        await chrome.storage.local.set({
          lastVoteSendError: `${res.status || 0} ${res.text || ""}`.trim()
        });
      }
      sendResponse({ ok: res.ok, status: res.status, text: res.text });
    })
    .catch(async (e) => {
      await chrome.storage.local.set({
        lastVoteSendError: String(e?.message || e)
      });
      sendResponse({ ok: false, status: 0, text: String(e?.message || e) });
    });

  return true; // async response
});

