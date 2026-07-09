const DEFAULTS = {
  endpointUrl: "",
  botId: "432610292342587392"
};

function nowMs() {
  return Date.now();
}

function urlContainsBotId(url, botId) {
  try {
    return String(url || "").includes(String(botId));
  } catch {
    return false;
  }
}

function looksLikeVotePage(url, botId) {
  try {
    const u = new URL(url);
    if (u.hostname !== "top.gg") return false;
    // Typical vote URL: /bot/<id>/vote
    return u.pathname === `/bot/${botId}/vote`;
  } catch {
    return false;
  }
}

function normalizeText(s) {
  return String(s || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function pageContainsVoteSuccessSignal() {
  // top.gg may change markup; we rely on multiple textual signals.
  const text = normalizeText(document.body?.innerText || "");
  const signals = [
    "thanks for voting",
    "thank you for voting",
    "vote received",
    "you have voted",
    "successfully voted",
    "come back in 12 hours",
    "every 12 hours",
    "remind me"
  ];
  return signals.some((s) => text.includes(s));
}

function extractDiscordUserIdFromLinks() {
  // top.gg profile URLs commonly look like:
  // - https://top.gg/user/<id>
  // - /user/<id>
  // Older/variant: /users/<id>
  const anchors = Array.from(document.querySelectorAll("a[href]"));
  for (const a of anchors) {
    const href = a.getAttribute("href") || "";
    const m = href.match(/\/users?\/(\d{10,30})/);
    if (m) return m[1];
    // Sometimes it's a full URL containing top.gg/user/<id>?...
    const m2 = href.match(/top\.gg\/users?\/(\d{10,30})/);
    if (m2) return m2[1];
  }
  return null;
}

function extractDiscordUserIdFromNextData() {
  // top.gg is a Next.js app. The logged-in user often appears in __NEXT_DATA__
  // (e.g. props.pageProps.session.user.id). This is far less error-prone than
  // regex-scanning the whole HTML for any random numeric ID.
  const el = document.getElementById("__NEXT_DATA__");
  if (!el?.textContent) return null;

  let data;
  try {
    data = JSON.parse(el.textContent);
  } catch {
    return null;
  }

  // Fast path: common next-auth shape.
  const direct =
    data?.props?.pageProps?.session?.user?.id ||
    data?.props?.pageProps?.user?.id ||
    data?.props?.pageProps?.session?.userId;
  if (typeof direct === "string" && /^\d{15,20}$/.test(direct)) return direct;

  // Heuristic: walk objects looking for a "user-like" object containing an ID.
  const seen = new Set();
  const stack = [data];
  while (stack.length) {
    const cur = stack.pop();
    if (!cur || typeof cur !== "object") continue;
    if (seen.has(cur)) continue;
    seen.add(cur);

    if (typeof cur.id === "string" && /^\d{15,20}$/.test(cur.id)) {
      // Require at least one additional user-ish field to avoid matching random IDs.
      if (
        typeof cur.username === "string" ||
        typeof cur.tag === "string" ||
        typeof cur.avatar === "string" ||
        typeof cur.global_name === "string"
      ) {
        return cur.id;
      }
    }

    for (const v of Object.values(cur)) {
      if (v && typeof v === "object") stack.push(v);
    }
  }

  return null;
}

function extractDiscordUserIdFromDiscordCdnAvatar() {
  // top.gg navbar avatar often uses Discord CDN:
  // https://cdn.discordapp.com/avatars/<discordUserId>/<hash>.png?...
  // If present, this is the most reliable signal.
  // Prefer the explicit account avatar element (alt="Avatar").
  const preferred = Array.from(
    document.querySelectorAll('img[alt="Avatar"][src*="cdn.discordapp.com/avatars/"]')
  );
  const images =
    preferred.length > 0 ? preferred : Array.from(document.querySelectorAll('img[alt="Avatar"][src]'));

  for (const img of images) {
    const src = img.getAttribute("src") || "";
    const m = src.match(/cdn\.discordapp\.com\/avatars\/(\d{15,20})\//);
    if (m) return m[1];
  }
  return null;
}

function extractDiscordUserId() {
  return (
    extractDiscordUserIdFromDiscordCdnAvatar() ||
    extractDiscordUserIdFromNextData() ||
    extractDiscordUserIdFromLinks()
  );
}

function tryReportDetectedUserId(discordUserId) {
  // Best-effort: used for popup display and debugging.
  chrome.runtime.sendMessage({ type: "MUDAE_USER_DETECTED", discordUserId }, () => {});
}

async function getConfig() {
  return await chrome.storage.sync.get(DEFAULTS);
}

async function notifyVoteIfNeeded() {
  const cfg = await getConfig();
  if (!cfg.botId) return;
  const discordUserId = extractDiscordUserId();
  if (discordUserId) tryReportDetectedUserId(discordUserId);

  if (!looksLikeVotePage(location.href, cfg.botId)) return;
  if (!pageContainsVoteSuccessSignal()) return;
  if (!discordUserId) return;

  // De-dupe per user per page-load window.
  const key = `mudae_vote_sent:${cfg.botId}:${discordUserId}`;
  if (sessionStorage.getItem(key) === "1") return;
  sessionStorage.setItem(key, "1");

  const event = {
    source: "topgg",
    botId: String(cfg.botId),
    discordUserId: String(discordUserId),
    votedAt: nowMs(),
    pageUrl: location.href
  };

  chrome.runtime.sendMessage({ type: "MUDAE_VOTE_EVENT", event }, (resp) => {
    // Keep logs minimal but useful for debugging.
    if (!resp?.ok) {
      console.warn("[Mudae Vote Tracker] vote event failed:", resp);
      // Allow retry if it failed.
      sessionStorage.removeItem(key);
    } else {
      console.log("[Mudae Vote Tracker] vote event sent:", resp.status);
    }
  });
}

async function sendVoteEventFromSignal(reason) {
  const cfg = await getConfig();
  const discordUserId = extractDiscordUserId();
  if (!cfg.botId) return;
  if (!discordUserId) return;

  const key = `mudae_vote_sent:${cfg.botId}:${discordUserId}`;
  if (sessionStorage.getItem(key) === "1") return;
  sessionStorage.setItem(key, "1");

  const event = {
    source: "topgg",
    botId: String(cfg.botId),
    discordUserId: String(discordUserId),
    votedAt: nowMs(),
    pageUrl: location.href,
    reason
  };

  chrome.runtime.sendMessage({ type: "MUDAE_VOTE_EVENT", event }, (resp) => {
    if (!resp?.ok) {
      console.warn("[Mudae Vote Tracker] vote event failed:", resp);
      sessionStorage.removeItem(key);
    } else {
      console.log("[Mudae Vote Tracker] vote event sent:", resp.status, reason);
    }
  });
}

function installNetworkHooks() {
  // If top.gg records votes via an API call, hook it and only fire when the call succeeds.
  // This handles cases where the URL and UI barely change.
  const cfgPromise = getConfig();

  const origFetch = window.fetch;
  if (typeof origFetch === "function") {
    window.fetch = async function patchedFetch(input, init) {
      const url = typeof input === "string" ? input : input?.url;
      const method = (init?.method || (typeof input !== "string" ? input?.method : null) || "GET").toUpperCase();

      const res = await origFetch.apply(this, arguments);

      try {
        const cfg = await cfgPromise;
        if (cfg?.botId && url && method === "POST" && urlContainsBotId(url, cfg.botId) && String(url).includes("vote")) {
          if (res?.ok) {
            sendVoteEventFromSignal(`fetch:${String(url).slice(0, 120)}`).catch(() => {});
          }
        }
      } catch {
        // ignore
      }

      return res;
    };
  }

  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function patchedOpen(method, url) {
    this.__mudae_method = String(method || "GET").toUpperCase();
    this.__mudae_url = url;
    return origOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function patchedSend() {
    this.addEventListener("load", async () => {
      try {
        const cfg = await cfgPromise;
        const url = this.__mudae_url;
        const method = this.__mudae_method || "GET";
        if (cfg?.botId && url && method === "POST" && urlContainsBotId(url, cfg.botId) && String(url).includes("vote")) {
          if (this.status >= 200 && this.status < 300) {
            sendVoteEventFromSignal(`xhr:${String(url).slice(0, 120)}`).catch(() => {});
          }
        }
      } catch {
        // ignore
      }
    });

    return origSend.apply(this, arguments);
  };
}

function startObserver() {
  // Immediately attempt once.
  notifyVoteIfNeeded().catch(() => {});

  // Hook network requests early.
  installNetworkHooks();

  // Then observe DOM changes (vote success message is often injected after captcha).
  const obs = new MutationObserver(() => {
    notifyVoteIfNeeded().catch(() => {});
  });
  obs.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
}

startObserver();

