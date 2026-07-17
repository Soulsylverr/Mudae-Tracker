/**
 * @name Mudae Tracker
 * @author Silas
 * @description Read-only HUD synced to Firebase. All tracking logic lives in the bot.
<<<<<<< HEAD
 * @version 4.0.0
=======
 * @version 4.0.1
>>>>>>> 776a853bc059a9501fa8787b5a0841731a1c05a9
 */

module.exports = class MudaeTracker {
  constructor() {
    this.DEFAULT_FIREBASE_URL =
      "https://mudaetracker-b57ce-default-rtdb.europe-west1.firebasedatabase.app";

    this.STAT_DEFS = [
      { id: "rolls", label: "Rolls", kind: "rolls" },
      { id: "claim", label: "Claim", kind: "claim" },
      { id: "dk", label: "Daily Kakera", kind: "timer", key: "dk" },
      { id: "daily", label: "Daily", kind: "timer", key: "daily" },
      { id: "rt", label: "RT", kind: "rt" },
      { id: "p", label: "Pokeslot", kind: "p" },
      { id: "oh", label: "Ouroharvest", kind: "oh" },
      { id: "oc", label: "Ourochest", kind: "oc" },
      { id: "vote", label: "Vote", kind: "timer", key: "vote", timeField: "readyAt", usedField: "lastVoted" },
    ];

    this.settings = this.loadSettings();

    this.myUserId = null;
    this.displayName = "";
    this.cloudData = null;
    this.syncOk = false;
    this.lastSyncAt = 0;
    this.lastSyncError = null;
    this.claimWarned = false;

    this.pollTimer = null;
    this.tickTimer = null;
    this.accountTimer = null;
    this.dragState = null;

    this.onDragMove = this.onDragMove.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
  }

  /* ── Settings ─────────────────────────────────────────── */

  defaultSettings() {
    return {
      firebaseUrl: this.DEFAULT_FIREBASE_URL,
      pollIntervalMs: 3000,
      anchor: "bottom-right",
      customPosition: null,
<<<<<<< HEAD
=======
      githubRepo: "Soulsylverr/Mudae-Tracker",
      autoUpdate: true,
>>>>>>> 776a853bc059a9501fa8787b5a0841731a1c05a9
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
  }

  loadSettings() {
    const saved = BdApi.Data.load("MudaeTrackerV4", "settings");
    const defaults = this.defaultSettings();
    if (!saved) return defaults;
    return {
      ...defaults,
      ...saved,
      visibility: { ...defaults.visibility, ...(saved.visibility || {}) },
    };
  }

  saveSettings() {
    BdApi.Data.save("MudaeTrackerV4", "settings", this.settings);
  }

  /* ── Lifecycle ─────────────────────────────────────────── */

  start() {
<<<<<<< HEAD
=======
    const previous = globalThis.__mudaeTrackerInstance;
    if (previous && previous !== this) previous.stop();
    globalThis.__mudaeTrackerInstance = this;
>>>>>>> 776a853bc059a9501fa8787b5a0841731a1c05a9
    this.waitForUser();
  }

  stop() {
    clearInterval(this.pollTimer);
    clearInterval(this.tickTimer);
    clearInterval(this.accountTimer);
<<<<<<< HEAD
=======
    clearInterval(this.updateTimer);
>>>>>>> 776a853bc059a9501fa8787b5a0841731a1c05a9
    document.removeEventListener("mousemove", this.onDragMove);
    document.removeEventListener("mouseup", this.onDragEnd);
    document.getElementById("mudae-tracker-ui")?.remove();
    BdApi.DOM.removeStyle("mudae-tracker-style");
<<<<<<< HEAD
=======
    if (globalThis.__mudaeTrackerInstance === this) {
      delete globalThis.__mudaeTrackerInstance;
    }
>>>>>>> 776a853bc059a9501fa8787b5a0841731a1c05a9
  }

  waitForUser() {
    try {
      const UserStore = BdApi.Webpack.getByKeys("getCurrentUser", "getUser");
      const user = UserStore?.getCurrentUser?.();
      if (!user?.id) {
        setTimeout(() => this.waitForUser(), 1000);
        return;
      }
      this.myUserId = user.id;
      this.displayName = user.globalName || user.username || "Unknown";
      this.boot();
    } catch (err) {
      console.error("[MudaeTracker] Waiting for user:", err);
      setTimeout(() => this.waitForUser(), 1000);
    }
  }

  boot() {
    this.injectCSS();
    this.createUI();
    this.applyAnchor();

    this.pollTimer = setInterval(() => this.fetchCloudData(), this.settings.pollIntervalMs);
    this.tickTimer = setInterval(() => this.render(), 1000);
    this.accountTimer = setInterval(() => this.checkAccountSwitch(), 3000);
<<<<<<< HEAD

    this.fetchCloudData();
=======
    this.updateTimer = setInterval(() => this.checkForUpdates(), 60 * 60 * 1000); // Check hourly

    this.fetchCloudData();
    this.checkForUpdates();
>>>>>>> 776a853bc059a9501fa8787b5a0841731a1c05a9
    BdApi.UI.showToast(`Mudae Tracker — ${this.displayName}`, { type: "success" });
  }

  checkAccountSwitch() {
    try {
      const UserStore = BdApi.Webpack.getByKeys("getCurrentUser", "getUser");
      const user = UserStore?.getCurrentUser?.();
      if (!user?.id || user.id === this.myUserId) return;

      this.myUserId = user.id;
      this.displayName = user.globalName || user.username || "Unknown";
      this.cloudData = null;
      this.claimWarned = false;
      this.fetchCloudData();
      this.render();
      BdApi.UI.showToast(`Switched to ${this.displayName}`, { type: "info" });
    } catch (err) {
      console.error("[MudaeTracker] Account switch check:", err);
    }
  }

<<<<<<< HEAD
=======
  /* ── Auto-update ─────────────────────────────────────────── */

  async checkForUpdates() {
    if (!this.settings.autoUpdate) return;

    try {
      const repo = this.settings.githubRepo || "Soulsylverr/Mudae-Tracker";
      const url = `https://api.github.com/repos/${repo}/commits?path=BetterDiscord/MudaeTracker.plugin.js&per_page=1`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const commits = await res.json();
      if (!commits || commits.length === 0) return;

      const latestCommit = commits[0];
      const latestSha = latestCommit.sha;
      const latestDate = new Date(latestCommit.commit.committer.date);

      const lastKnownSha = BdApi.Data.load("MudaeTrackerV4", "lastKnownSha");
      if (lastKnownSha === latestSha) return; // Already up to date

      // New version available
      BdApi.UI.showToast("New version available! Check plugin settings.", { type: "info", timeout: 10000 });
      this.updateAvailable = { sha: latestSha, date: latestDate, url: latestCommit.html_url };
    } catch (err) {
      console.error("[MudaeTracker] Update check failed:", err);
    }
  }

  async updatePlugin() {
    if (!this.updateAvailable) {
      BdApi.UI.showToast("No update available", { type: "error" });
      return;
    }

    try {
      const repo = this.settings.githubRepo || "Soulsylverr/Mudae-Tracker";
      const url = `https://raw.githubusercontent.com/${repo}/main/BetterDiscord/MudaeTracker.plugin.js`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const newCode = await res.text();

      // Save the new version
      BdApi.Data.save("MudaeTrackerV4", "lastKnownSha", this.updateAvailable.sha);

      // Write to plugin file
      const fs = require("fs");
      const path = require("path");
      const pluginPath = path.join(__dirname, "MudaeTracker.plugin.js");
      fs.writeFileSync(pluginPath, newCode, "utf8");

      BdApi.UI.showToast("Plugin updated! Reloading...", { type: "success" });
      setTimeout(() => location.reload(), 2000);
    } catch (err) {
      console.error("[MudaeTracker] Update failed:", err);
      BdApi.UI.showToast(`Update failed: ${err.message}`, { type: "error" });
    }
  }

>>>>>>> 776a853bc059a9501fa8787b5a0841731a1c05a9
  /* ── Firebase (read-only) ──────────────────────────────── */

  firebaseBase() {
    return (this.settings.firebaseUrl || this.DEFAULT_FIREBASE_URL).replace(/\/$/, "");
  }

  async fetchCloudData() {
    if (!this.myUserId) return;

    try {
      const url = `${this.firebaseBase()}/users/${this.myUserId}.json`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      this.cloudData = data || {};
      this.syncOk = true;
      this.lastSyncAt = Date.now();
      this.lastSyncError = null;
      this.render();
    } catch (err) {
      this.syncOk = false;
      this.lastSyncError = err?.message || "Sync failed";
      console.error("[MudaeTracker] Firebase sync:", err);
      this.render();
    }
  }

  /* ── Schedule helpers (mirrors Bot/lib/fixedSchedules.js, Europe/Berlin) ─ */

  berlinParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Berlin",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hourCycle: "h23",
    }).formatToParts(date);
    const pick = (type) => parseInt(parts.find((p) => p.type === type).value, 10);
    return {
      year: pick("year"),
      month: pick("month"),
      day: pick("day"),
      hour: pick("hour"),
      minute: pick("minute"),
      second: pick("second"),
    };
  }

  utcFromBerlin(year, month, day, hour, minute, second = 0) {
    const base = Date.UTC(year, month - 1, day, hour, minute, second);
    for (let offset = -3 * 3_600_000; offset <= 3 * 3_600_000; offset += 3_600_000) {
      const candidate = new Date(base + offset);
      const p = this.berlinParts(candidate);
      if (
        p.year === year &&
        p.month === month &&
        p.day === day &&
        p.hour === hour &&
        p.minute === minute &&
        p.second === second
      ) {
        return candidate;
      }
    }
    throw new Error(`utcFromBerlin: could not resolve ${year}-${month}-${day} ${hour}:${minute}`);
  }

  atBerlinMinute(date, minute = 24) {
    const p = this.berlinParts(date);
    return this.utcFromBerlin(p.year, p.month, p.day, p.hour, minute, 0);
  }

  addHours(date, hours) {
    return new Date(date.getTime() + hours * 3_600_000);
  }

  nextRollsReset(now = new Date()) {
    let candidate = this.atBerlinMinute(now);
    if (candidate <= now) candidate = this.addHours(candidate, 1);
    return this.atBerlinMinute(candidate);
  }

  nextClaimReset(now = new Date()) {
    let candidate = this.atBerlinMinute(now);
    if (candidate <= now) candidate = this.atBerlinMinute(this.addHours(candidate, 1));

    while (candidate <= now || this.berlinParts(candidate).hour % 3 !== 2) {
      candidate = this.atBerlinMinute(this.addHours(candidate, 1));
    }
    return candidate;
  }

  nextPokeslotReset(now = new Date()) {
    const p = this.berlinParts(now);
    let candidate = this.utcFromBerlin(p.year, p.month, p.day, p.hour, 0, 0);
    if (candidate <= now) candidate = this.addHours(candidate, 1);

    while (candidate <= now || this.berlinParts(candidate).hour % 2 !== 0) {
      candidate = this.addHours(candidate, 1);
    }
    return candidate;
  }

  currentRollWindowStart(now = new Date()) {
    return this.addHours(this.nextRollsReset(now), -1);
  }

  currentClaimWindowStart(now = new Date()) {
    return this.addHours(this.nextClaimReset(now), -3);
  }

  currentPokeslotWindowStart(now = new Date()) {
    return this.addHours(this.nextPokeslotReset(now), -2);
  }

  /* ── Display computation ───────────────────────────────── */

  formatTimeLeft(endTimestamp) {
    if (!endTimestamp || endTimestamp <= Date.now()) return "Ready";
    const diff = endTimestamp - Date.now();
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1000);
    return `${h > 0 ? `${h}h ` : ""}${m}m ${s}s`;
  }

  computeViewModel() {
    const now = new Date();
    const config = this.cloudData?.config || {};
    const state = this.cloudData?.state || {};
    const maxRolls = Number(config.maxRolls) || 10;

    const rollWindow = this.currentRollWindowStart(now).toISOString();
    const rollState = state.roll;
    const rollsUsed =
      rollState?.windowStart === rollWindow ? Number(rollState.rollsUsed) || 0 : 0;
    const rollsRemaining = Math.max(0, maxRolls - rollsUsed);

    const claimWindowStart = this.currentClaimWindowStart(now).getTime();
    const claimUsedAt = state.claim?.lastUsedWindowStart;
    const lastUsedAt = Number(state.claim?.lastUsedAt) || 0;
    const refilled = String(claimUsedAt || "").startsWith("refilled:");
    const usedInCurrentWindow =
      !refilled &&
      (lastUsedAt >= claimWindowStart ||
        claimUsedAt === this.currentClaimWindowStart(now).toISOString());
    const claimAvailable = !usedInCurrentWindow || refilled;
    const nextClaimReset = claimAvailable
      ? this.nextClaimReset(now).getTime()
      : this.nextClaimReset(now).getTime();

    const pokeslotWindowStart = this.currentPokeslotWindowStart(now).toISOString();
    const pokeslotUsed = state.p?.lastUsedWindowStart === pokeslotWindowStart;
    const nextPokeslotReset = this.nextPokeslotReset(now).getTime();

    const timerRow = (key, timeField = "readyAt") => {
      const entry = state[key];
      const endAt = entry?.[timeField] || 0;
      const ready = !endAt || endAt <= Date.now();
      return {
        status: ready ? "ready" : "wait",
        value: ready ? "Ready" : this.formatTimeLeft(endAt),
        endAt,
      };
    };

    const emeraldLevel = Number(config.emeraldLevel) || 0;
    const diamondLevel = Number(config.diamondLevel) || 0;
    const todayUTC = now.toISOString().slice(0, 10);
    const ohState = state.oh;
    const ohUsesToday =
      ohState?.lastResetDate === todayUTC ? Number(ohState.usesUsed) || 0 : 0;
    const ohRemaining =
      diamondLevel > 0 ? Math.max(0, diamondLevel - ohUsesToday) : 0;

    const ocDailyLimit = diamondLevel >= 4 ? 1 : 0;
    const ocState = state.oc;
    const ocUsesToday =
      ocState?.lastResetDate === todayUTC ? Number(ocState.usesUsed) || 0 : 0;
    const ocRemaining =
      ocDailyLimit > 0 ? Math.max(0, ocDailyLimit - ocUsesToday) : 0;

    const rtTimer = timerRow("rt");

    return {
      rolls: {
        status: rollsRemaining > 0 ? "ready" : "used",
        value: this.formatTimeLeft(this.nextRollsReset(now).getTime()),
        detail: `${rollsRemaining}/${maxRolls}`,
      },
      claim: {
        status: claimAvailable ? "ready" : "used",
        value: this.formatTimeLeft(nextClaimReset),
        detail: claimAvailable ? "Ready" : "Used",
        warn:
          claimAvailable && nextClaimReset - Date.now() <= 3_600_000,
      },
      dk: timerRow("dk"),
      daily: timerRow("daily"),
      rt:
        emeraldLevel === 0
          ? { status: "locked", value: "Locked" }
          : rtTimer,
      p: {
        status: pokeslotUsed ? "used" : "ready",
        value: this.formatTimeLeft(nextPokeslotReset),
        detail: pokeslotUsed ? "Used" : "Ready",
      },
      vote: timerRow("vote"),
      oh: {
        status:
          diamondLevel === 0
            ? "locked"
            : ohRemaining > 0
              ? "ready"
              : "used",
        value:
          diamondLevel === 0
            ? "Locked"
            : `${ohRemaining}/${diamondLevel} today`,
      },
      oc: {
        status:
          ocDailyLimit === 0
            ? "locked"
            : ocRemaining > 0
              ? "ready"
              : "used",
        value:
          ocDailyLimit === 0
            ? "Locked"
            : ocRemaining > 0
              ? "Ready"
              : "Used today",
      },
    };
  }

  /* ── UI ─────────────────────────────────────────────────── */

  injectCSS() {
    BdApi.DOM.addStyle(
      "mudae-tracker-style",
      `
      #mudae-tracker-ui {
        position: fixed;
        background: rgba(28, 28, 30, 0.92);
        backdrop-filter: blur(8px);
        border: 1px solid #3a3a3c;
        border-radius: 10px;
        padding: 0;
        color: #f2f2f7;
        font-family: "gg sans", sans-serif;
        z-index: 9999;
        box-shadow: 0 8px 24px rgba(0,0,0,0.55);
        width: 260px;
        user-select: none;
        overflow: hidden;
      }
      .mudae-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px 8px;
        cursor: grab;
        border-bottom: 1px solid rgba(58,58,60,0.6);
      }
      .mudae-header:active { cursor: grabbing; }
      .mudae-title-wrap { min-width: 0; }
      .mudae-title {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #8e8e93;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .mudae-subtitle {
        font-size: 10px;
        color: #636366;
        margin-top: 2px;
      }
      .mudae-sync-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
        margin-left: 8px;
      }
      .mudae-sync-dot.ok { background: #34c759; box-shadow: 0 0 6px rgba(52,199,89,0.5); }
      .mudae-sync-dot.err { background: #ff453a; box-shadow: 0 0 6px rgba(255,69,58,0.4); }
      .mudae-body { padding: 10px 14px 12px; }
      .mudae-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 7px;
        font-size: 13px;
        gap: 8px;
      }
      .mudae-row:last-child { margin-bottom: 0; }
      .mudae-label { font-weight: 600; color: #aeaeb2; flex-shrink: 0; }
      .mudae-value { text-align: right; font-weight: 500; color: #e5e5ea; }
      .mudae-ready { color: #34c759; font-weight: 700; }
      .mudae-used { color: #ff453a; font-weight: 700; }
      .mudae-locked { color: #8e8e93; font-weight: 600; }
      .mudae-wait { color: #e5e5ea; font-weight: 500; }
      .mudae-row-warn .mudae-label,
      .mudae-row-warn .mudae-value { animation: mudae-pulse 2.5s ease-in-out infinite; }
      @keyframes mudae-pulse {
        0%, 100% { color: #e5e5ea; }
        50% { color: #ff9500; text-shadow: 0 0 6px rgba(255,149,0,0.35); }
      }
      .mudae-badge-row { font-size: 12px; }
      .mudae-badge-row .mudae-value { font-size: 11px; color: #c7c7cc; }
      .mudae-empty {
        font-size: 12px;
        color: #8e8e93;
        text-align: center;
        padding: 8px 0 2px;
      }
      .mudae-btn {
        padding: 6px 10px;
        background: #4f545c;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
      }
      .mudae-btn:hover { background: #686d73; }
      .mudae-btn-primary { background: #5865F2; }
      .mudae-btn-primary:hover { background: #4752c4; }
      .mudae-settings-input {
        margin-top: 6px;
        padding: 6px 8px;
        background: #1e1f22;
        color: #fff;
        border: 1px solid #555;
        border-radius: 4px;
        width: 100%;
        box-sizing: border-box;
        font-size: 13px;
      }
      .mudae-toggle-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px 12px;
        margin-top: 8px;
      }
      .mudae-toggle-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        cursor: pointer;
      }
      .mudae-toggle-item input { cursor: pointer; }
      .mudae-settings-section {
        background: #2b2d31;
        border-radius: 6px;
        padding: 10px;
        margin-bottom: 14px;
      }
      .mudae-settings-label {
        font-size: 11px;
        color: #8e8e93;
        text-transform: uppercase;
        font-weight: 700;
      }
    `
    );
  }

  createUI() {
    let ui = document.getElementById("mudae-tracker-ui");
    if (!ui) {
      ui = document.createElement("div");
      ui.id = "mudae-tracker-ui";
      document.body.appendChild(ui);

      const header = document.createElement("div");
      header.className = "mudae-header";
      header.id = "mudae-tracker-header";
      header.addEventListener("mousedown", (e) => this.onDragStart(e));

      const body = document.createElement("div");
      body.className = "mudae-body";
      body.id = "mudae-tracker-body";

      ui.appendChild(header);
      ui.appendChild(body);
    }
    this.render();
  }

  applyAnchor() {
    const ui = document.getElementById("mudae-tracker-ui");
    if (!ui) return;

    ui.style.top = "";
    ui.style.right = "";
    ui.style.bottom = "";
    ui.style.left = "";

    const offset = 20;
    const anchor = this.settings.anchor;

    if (anchor === "custom" && this.settings.customPosition) {
      ui.style.left = `${this.settings.customPosition.x}px`;
      ui.style.top = `${this.settings.customPosition.y}px`;
      return;
    }

    if (anchor === "top-left") {
      ui.style.top = `${offset}px`;
      ui.style.left = `${offset}px`;
    } else if (anchor === "top-right") {
      ui.style.top = `${offset}px`;
      ui.style.right = `${offset}px`;
    } else if (anchor === "bottom-left") {
      ui.style.bottom = `${offset}px`;
      ui.style.left = `${offset}px`;
    } else {
      ui.style.bottom = `${offset}px`;
      ui.style.right = `${offset}px`;
    }
  }

  onDragStart(e) {
    if (e.button !== 0) return;
    const ui = document.getElementById("mudae-tracker-ui");
    if (!ui) return;

    const rect = ui.getBoundingClientRect();
    this.dragState = {
      startX: e.clientX,
      startY: e.clientY,
      origX: rect.left,
      origY: rect.top,
    };

    ui.style.bottom = "";
    ui.style.right = "";
    ui.style.left = `${rect.left}px`;
    ui.style.top = `${rect.top}px`;

    document.addEventListener("mousemove", this.onDragMove);
    document.addEventListener("mouseup", this.onDragEnd);
    e.preventDefault();
  }

  onDragMove(e) {
    if (!this.dragState) return;
    const ui = document.getElementById("mudae-tracker-ui");
    if (!ui) return;

    const dx = e.clientX - this.dragState.startX;
    const dy = e.clientY - this.dragState.startY;
    const x = Math.max(0, Math.min(window.innerWidth - ui.offsetWidth, this.dragState.origX + dx));
    const y = Math.max(0, Math.min(window.innerHeight - ui.offsetHeight, this.dragState.origY + dy));

    ui.style.left = `${x}px`;
    ui.style.top = `${y}px`;
  }

  onDragEnd() {
    const ui = document.getElementById("mudae-tracker-ui");
    if (ui) {
      const rect = ui.getBoundingClientRect();
      this.settings.anchor = "custom";
      this.settings.customPosition = { x: rect.left, y: rect.top };
      this.saveSettings();
    }
    this.dragState = null;
    document.removeEventListener("mousemove", this.onDragMove);
    document.removeEventListener("mouseup", this.onDragEnd);
  }

  valueClass(status) {
    if (status === "ready") return "mudae-ready";
    if (status === "used") return "mudae-used";
    if (status === "locked") return "mudae-locked";
    return "mudae-wait";
  }

  render() {
    const header = document.getElementById("mudae-tracker-header");
    const body = document.getElementById("mudae-tracker-body");
    if (!header || !body) return;

    const syncClass = this.syncOk ? "ok" : "err";
    const syncTitle = this.syncOk
      ? `Synced ${this.lastSyncAt ? new Date(this.lastSyncAt).toLocaleTimeString() : ""}`
      : this.lastSyncError || "Not connected";

    header.innerHTML = `
      <div class="mudae-title-wrap">
        <div class="mudae-title">Mudae · ${this.displayName || "…"}</div>
        <div class="mudae-subtitle">Drag to move · ${this.myUserId || "…"}</div>
      </div>
      <div class="mudae-sync-dot ${syncClass}" title="${syncTitle}"></div>
    `;

    const vm = this.computeViewModel();
    const visible = this.STAT_DEFS.filter((s) => this.settings.visibility[s.id]);

    if (vm.claim.warn && !this.claimWarned) {
      this.claimWarned = true;
      BdApi.UI.showToast("Last roll phase — don't forget your claim!", {
        type: "info",
        timeout: 5000,
      });
    }
    if (!vm.claim.warn) this.claimWarned = false;

    if (!this.cloudData && !this.lastSyncError) {
      body.innerHTML = `<div class="mudae-empty">Syncing with Firebase…</div>`;
      return;
    }

    if (!visible.length) {
      body.innerHTML = `<div class="mudae-empty">No stats enabled.<br>Open plugin settings to choose what to show.</div>`;
      return;
    }

    let html = "";

    if (this.lastSyncError && !this.cloudData) {
      html += `<div class="mudae-empty" style="margin-bottom:8px;">${this.lastSyncError}</div>`;
    }

    for (const stat of visible) {
      if (stat.kind === "rolls") {
        const rollCountClass = vm.rolls.status === "used" ? "mudae-used" : "mudae-ready";
        html += `
          <div class="mudae-row">
            <span class="mudae-label">Rolls (<span class="${rollCountClass}">${vm.rolls.detail}</span>)</span>
            <span class="mudae-value mudae-wait">${vm.rolls.value}</span>
          </div>`;
      } else if (stat.kind === "claim") {
        html += `
          <div class="mudae-row${vm.claim.warn ? " mudae-row-warn" : ""}">
            <span class="mudae-label">Claim · <span class="${this.valueClass(vm.claim.status)}">${vm.claim.detail}</span></span>
            <span class="mudae-value mudae-wait">${vm.claim.value}</span>
          </div>`;
      } else if (stat.kind === "rt" || stat.kind === "oh" || stat.kind === "oc") {
        const row = vm[stat.id];
        html += `
          <div class="mudae-row">
            <span class="mudae-label">${stat.label}</span>
            <span class="mudae-value ${this.valueClass(row.status)}">${row.value}</span>
          </div>`;
      } else if (stat.kind === "p") {
        html += `
          <div class="mudae-row">
            <span class="mudae-label">Pokeslot · <span class="${this.valueClass(vm.p.status)}">${vm.p.detail}</span></span>
            <span class="mudae-value mudae-wait">${vm.p.value}</span>
          </div>`;
      } else if (stat.kind === "timer") {
        const row = vm[stat.key];
        html += `
          <div class="mudae-row">
            <span class="mudae-label">${stat.label}</span>
            <span class="mudae-value ${this.valueClass(row.status)}">${row.value}</span>
          </div>`;
      }
    }

    body.innerHTML = html;
  }

  /* ── Settings panel ────────────────────────────────────── */

  getSettingsPanel() {
    const panel = document.createElement("div");
    panel.style.cssText = "color:#fff;padding:15px;max-width:440px;";

    const vis = this.settings.visibility;
    const toggles = this.STAT_DEFS.map(
      (s) => `
        <label class="mudae-toggle-item">
          <input type="checkbox" data-stat="${s.id}" ${vis[s.id] ? "checked" : ""} />
          ${s.label}
        </label>`
    ).join("");

<<<<<<< HEAD
=======
    const updateStatus = this.updateAvailable
      ? `<span style="color:#34c759;font-size:11px;">Update available (${this.updateAvailable.date.toLocaleDateString()})</span>`
      : `<span style="color:#8e8e93;font-size:11px;">Up to date</span>`;

>>>>>>> 776a853bc059a9501fa8787b5a0841731a1c05a9
    panel.innerHTML = `
      <div class="mudae-settings-section">
        <div class="mudae-settings-label">Account</div>
        <div style="font-size:15px;font-weight:600;margin-top:4px;">${this.displayName || "Not detected"}</div>
        <div style="font-size:11px;color:#b5bac1;margin-top:4px;">Discord ID: ${this.myUserId || "—"}</div>
        <div style="font-size:11px;color:#b5bac1;margin-top:2px;">Read-only sync from Firebase. The bot handles all tracking.</div>
      </div>

<<<<<<< HEAD
=======
      <div class="mudae-settings-section">
        <div class="mudae-settings-label">Auto-update</div>
        <label class="mudae-toggle-item" style="margin-top:8px;">
          <input type="checkbox" id="mt-auto-update" ${this.settings.autoUpdate ? "checked" : ""} />
          Enable auto-update (checks hourly)
        </label>
        <div style="margin-top:8px;">
          <label style="font-size:11px;color:#b5bac1;">GitHub repo</label>
          <input class="mudae-settings-input" id="mt-github-repo" value="${this.settings.githubRepo}" placeholder="owner/repo" />
        </div>
        <div style="margin-top:8px;display:flex;justify-content:space-between;align-items:center;">
          ${updateStatus}
          <button class="mudae-btn" id="mt-check-update" style="padding:4px 8px;font-size:11px;">Check now</button>
        </div>
        ${this.updateAvailable ? `<button class="mudae-btn mudae-btn-primary" id="mt-update-now" style="margin-top:8px;width:100%;">Update now</button>` : ""}
      </div>

>>>>>>> 776a853bc059a9501fa8787b5a0841731a1c05a9
      <label><b>Firebase URL</b></label>
      <input class="mudae-settings-input" id="mt-firebase-url" value="${this.settings.firebaseUrl}" />

      <label style="display:block;margin-top:14px;"><b>HUD anchor</b></label>
      <select class="mudae-settings-input" id="mt-anchor">
        <option value="bottom-right" ${this.settings.anchor === "bottom-right" ? "selected" : ""}>Bottom right</option>
        <option value="bottom-left" ${this.settings.anchor === "bottom-left" ? "selected" : ""}>Bottom left</option>
        <option value="top-right" ${this.settings.anchor === "top-right" ? "selected" : ""}>Top right</option>
        <option value="top-left" ${this.settings.anchor === "top-left" ? "selected" : ""}>Top left</option>
        <option value="custom" ${this.settings.anchor === "custom" ? "selected" : ""}>Custom (dragged)</option>
      </select>

      <label style="display:block;margin-top:14px;"><b>Visible stats</b></label>
      <div class="mudae-toggle-grid">${toggles}</div>

      <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap;">
        <button class="mudae-btn mudae-btn-primary" id="mt-save">Save</button>
        <button class="mudae-btn" id="mt-refresh">Refresh now</button>
        <button class="mudae-btn" id="mt-reset-pos">Reset position</button>
      </div>
    `;

    panel.querySelector("#mt-save").addEventListener("click", () => {
      this.settings.firebaseUrl =
        panel.querySelector("#mt-firebase-url").value.trim() || this.DEFAULT_FIREBASE_URL;
      this.settings.anchor = panel.querySelector("#mt-anchor").value;
<<<<<<< HEAD
=======
      this.settings.githubRepo = panel.querySelector("#mt-github-repo").value.trim() || "Soulsylverr/Mudae-Tracker";
      this.settings.autoUpdate = panel.querySelector("#mt-auto-update").checked;
>>>>>>> 776a853bc059a9501fa8787b5a0841731a1c05a9

      panel.querySelectorAll("[data-stat]").forEach((input) => {
        this.settings.visibility[input.dataset.stat] = input.checked;
      });

      this.saveSettings();
      this.applyAnchor();
      this.fetchCloudData();
      BdApi.UI.showToast("Settings saved", { type: "success" });
    });

    panel.querySelector("#mt-refresh").addEventListener("click", async () => {
      await this.fetchCloudData();
      BdApi.UI.showToast(this.syncOk ? "Data refreshed" : "Refresh failed", {
        type: this.syncOk ? "success" : "error",
      });
    });

    panel.querySelector("#mt-reset-pos").addEventListener("click", () => {
      this.settings.anchor = "bottom-right";
      this.settings.customPosition = null;
      this.saveSettings();
      this.applyAnchor();
      panel.querySelector("#mt-anchor").value = "bottom-right";
      BdApi.UI.showToast("Position reset to bottom-right", { type: "info" });
    });

<<<<<<< HEAD
=======
    panel.querySelector("#mt-check-update").addEventListener("click", async () => {
      await this.checkForUpdates();
      if (this.updateAvailable) {
        BdApi.UI.showToast("Update available!", { type: "info" });
        // Refresh the panel to show update button
        panel.remove();
        BdApi.showSettingsPanel("MudaeTracker");
      } else {
        BdApi.UI.showToast("Already up to date", { type: "success" });
      }
    });

    if (this.updateAvailable) {
      panel.querySelector("#mt-update-now").addEventListener("click", () => {
        this.updatePlugin();
      });
    }

>>>>>>> 776a853bc059a9501fa8787b5a0841731a1c05a9
    return panel;
  }
};
