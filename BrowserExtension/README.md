# Mudae Vote Tracker (Browser Extension)

Detects successful votes for Mudae on top.gg and sends them to your bot's vote receiver.

## Setup

1. Load unpacked from `BrowserExtension/` in `chrome://extensions`
2. Configure in extension options:
   - **Vote endpoint URL**: `https://<your-render-app>.onrender.com/vote-event`
   - **Auth token**: same value as `VOTE_RECEIVER_AUTH` on Render
   - **botId**: `432610292342587392`

## Test

Use the **Test** button in options — it calls `/vote-event/validate` without writing to Firebase.

## Vote flow

After a successful vote, the extension POSTs to your bot:

```json
{
  "source": "topgg",
  "botId": "432610292342587392",
  "discordUserId": "123456789012345678",
  "votedAt": 1712345678901,
  "pageUrl": "https://top.gg/bot/432610292342587392/vote"
}
```

The bot writes `/users/<discordUserId>/state/vote` in Firebase.
