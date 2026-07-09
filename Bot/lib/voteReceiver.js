const http = require('http');
const { writeVote } = require('./firebase');

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) {
        reject(new Error('body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

/**
 * Receives vote events from the browser extension.
 *
 * Env:
 * - PORT (default 3000, Render provides this)
 * - VOTE_RECEIVER_AUTH (shared secret; extension sends it as x-mudae-auth header)
 *
 * Endpoint:
 * - POST /vote-event
 *
 * Expected payload:
 * - { source: "topgg", botId: "<id>", discordUserId: "<id>", votedAt: <ms>, pageUrl: "<url>" }
 */
function startVoteReceiverServer() {
  const port = Number(process.env.PORT || 3000);
  const expectedAuth = process.env.VOTE_RECEIVER_AUTH;

  if (!expectedAuth) {
    console.warn('[vote] VOTE_RECEIVER_AUTH is not set; vote receiver will not start.');
    return null;
  }

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      if (req.method !== 'POST' || url.pathname !== '/vote-event') {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const auth = String(req.headers['x-mudae-auth'] || '');
      if (auth !== expectedAuth) {
        json(res, 401, { ok: false, error: 'unauthorized' });
        return;
      }

      const raw = await readBody(req);
      let payload;
      try {
        payload = JSON.parse(raw || '{}');
      } catch {
        json(res, 400, { ok: false, error: 'invalid_json' });
        return;
      }

      const userId = payload?.discordUserId;
      const votedAt = payload?.votedAt;

      if (!userId || typeof userId !== 'string') {
        json(res, 400, { ok: false, error: 'missing_discordUserId' });
        return;
      }
      if (!Number.isFinite(votedAt)) {
        json(res, 400, { ok: false, error: 'missing_votedAt' });
        return;
      }

      // Guardrail: ignore events too far from "now" (helps reduce abuse).
      const now = Date.now();
      const skewMs = Math.abs(now - votedAt);
      if (skewMs > 10 * 60_000) {
        json(res, 400, { ok: false, error: 'timestamp_out_of_range' });
        return;
      }

      await writeVote(userId, votedAt);
      json(res, 200, { ok: true });
    } catch (e) {
      console.error('[vote] receiver error:', e);
      json(res, 500, { ok: false, error: 'server_error' });
    }
  });

  server.listen(port, () => {
    console.log(`[vote] Receiver listening on :${port} (POST /vote-event)`);
  });

  return server;
}

module.exports = { startVoteReceiverServer };

