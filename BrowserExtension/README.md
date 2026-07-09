# Mudae Vote Tracker (Browser Extension)

This extension detects successful votes for the Mudae bot on top.gg and reports:

- `discordUserId` (the logged-in top.gg/Discord user)
- `votedAt` (timestamp in ms)

## Why it needs a server endpoint

Your existing tracker writes to Firebase Realtime Database using the **Firebase Admin SDK** (`Bot/lib/firebase.js` + `serviceAccountKey.json`).
That is **not safe** to embed in a browser extension.

So the extension sends vote events to a small HTTPS endpoint you control (recommended: Firebase Cloud Function / Cloud Run / any Node server),
and that server writes to RTDB using the Admin SDK.

## Setup

1. Load the extension
   - Chrome/Edge: `chrome://extensions` → enable Developer mode → **Load unpacked**
   - Select the `BrowserExtension/` folder.

2. Open the extension options and configure:
   - **Vote endpoint URL** (your HTTPS endpoint that accepts the vote event)
   - **top.gg bot id** (defaults to `432610292342587392` for Mudae)

3. Vote on top.gg:
   - Go to `https://top.gg/bot/<botId>/vote`
   - After a successful vote, the extension posts:

```json
{
  "source": "topgg",
  "botId": "432610292342587392",
  "discordUserId": "123456789012345678",
  "votedAt": 1712345678901,
  "pageUrl": "https://top.gg/bot/432610292342587392/vote"
}
```

## Endpoint contract (what your server should implement)

- Method: `POST`
- Content-Type: `application/json`
- Body: JSON shown above
- Response:
  - `2xx` on success
  - `4xx/5xx` on failure (the extension will retry a few times)

