/**
 * Prevents Render free-tier spin-down by hitting /health before the ~15 min idle limit.
 *
 * Render sets RENDER_EXTERNAL_URL automatically. Override with KEEPALIVE_URL if needed.
 * If self-ping ever stops working, also set up UptimeRobot on GET /health every 5 min.
 */

function keepaliveUrl() {
  const base =
    process.env.KEEPALIVE_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    (process.env.PORT ? `http://127.0.0.1:${process.env.PORT}` : null);

  if (!base) return null;
  return `${base.replace(/\/$/, '')}/health`;
}

function startKeepalive() {
  const url = keepaliveUrl();
  if (!url) {
    console.warn('[keepalive] No URL available; set RENDER_EXTERNAL_URL on Render.');
    return null;
  }

  const intervalMs = Number(process.env.KEEPALIVE_INTERVAL_MS) || 5 * 60 * 1000;

  async function ping() {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (!res.ok) console.warn(`[keepalive] ${res.status} ${url}`);
      else console.log(`[keepalive] ok ${url}`);
    } catch (err) {
      console.warn('[keepalive] ping failed:', err.message);
    }
  }

  // First ping shortly after boot (vote server must be listening).
  setTimeout(ping, 15_000);
  const timer = setInterval(ping, intervalMs);
  console.log(`[keepalive] scheduled every ${Math.round(intervalMs / 60_000)} min → ${url}`);
  return timer;
}

module.exports = { startKeepalive };
