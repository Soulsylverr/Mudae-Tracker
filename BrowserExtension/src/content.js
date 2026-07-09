const DEFAULTS = {
  endpointUrl: "",
  botId: "432610292342587392"
};

function nowMs() {
  return Date.now();
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

function extractDiscordUserIdFromHtml() {
  // As a last resort, scan HTML for a user/<id> occurrence.
  const html = document.documentElement?.innerHTML || "";
  const m = html.match(/\/users?\/(\d{10,30})/);
  return m ? m[1] : null;
}

function extractDiscordUserId() {
  return extractDiscordUserIdFromLinks() || extractDiscordUserIdFromHtml();
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

function startObserver() {
  // Immediately attempt once.
  notifyVoteIfNeeded().catch(() => {});

  // Then observe DOM changes (vote success message is often injected after captcha).
  const obs = new MutationObserver(() => {
    notifyVoteIfNeeded().catch(() => {});
  });
  obs.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
}

startObserver();

