const http = require('http');
const { writeVote } = require('./firebase');

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      // basic limit to avoid abuse (1MB)
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
 * Starts a webhook receiver for top.gg votes.
 *
 * Env:
 * - PORT (default 3000)
 * - TOPGG_WEBHOOK_AUTH (shared secret; sent by top.gg as Authorization header)
 *
 * Endpoint:
 * - POST /topgg/webhook
 *
 * Expected payload (top.gg standard):
 * - { user: "<discordUserId>", type: "upvote", ... }
 */
function startTopggWebhookServer() {
  const port = Number(process.env.PORT || 3000);
  const expectedAuth = process.env.TOPGG_WEBHOOK_AUTH;

  if (!expectedAuth) {
    console.warn('[topgg] TOPGG_WEBHOOK_AUTH is not set; webhook server will not start.');
    return null;
  }

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      if (req.method !== 'POST' || url.pathname !== '/topgg/webhook') {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const auth = String(req.headers.authorization || '');
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

      const userId = payload?.user;
      const type = payload?.type;
      if (!userId || typeof userId !== 'string') {
        json(res, 400, { ok: false, error: 'missing_user' });
        return;
      }
      if (type && type !== 'upvote') {
        json(res, 400, { ok: false, error: 'unsupported_type', type });
        return;
      }

      await writeVote(userId, Date.now());
      json(res, 200, { ok: true });
    } catch (e) {
      console.error('[topgg] webhook error:', e);
      json(res, 500, { ok: false, error: 'server_error' });
    }
  });

  server.listen(port, () => {
    console.log(`[topgg] Webhook server listening on :${port} (POST /topgg/webhook)`);
  });

  return server;
}

module.exports = { startTopggWebhookServer };

