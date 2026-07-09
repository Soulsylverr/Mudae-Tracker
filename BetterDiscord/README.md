# Mudae Tracker — BetterDiscord Plugin

Read-only HUD that displays timer/state data from Firebase. **All tracking logic lives in the bot** (`Bot/`).

## Install

1. Copy `MudaeTracker.plugin.js` into your BetterDiscord plugins folder:
   - Windows: `%AppData%\BetterDiscord\plugins\`
2. Enable the plugin in BetterDiscord settings.
3. Reload Discord.

## How it works

- Auto-detects your logged-in Discord user ID.
- Polls `/users/<yourId>.json` from Firebase every 3 seconds.
- Computes display values from the same schema the bot writes (rolls, claim windows, cooldown timers, badges, vote).
- **Never writes** to Firebase.

## HUD features

- Toggle each stat on/off in plugin settings.
- Drag the header to reposition; pick a corner anchor or keep a custom position.
- Green/red sync dot shows Firebase connection status.
- Claim warning pulse in the last hour before claim reset (when claim is still available).

## Default visible stats

Rolls, Claim, Daily Kakera, Daily, Vote. Enable RT, Pokeslot, Ouroharvest, and Ourochest in settings if you use them. RT requires Emerald badge; Ouroharvest requires Diamond; Ourochest requires Diamond level 4.

## Requirements

- The bot must be running and tracking your Discord ID.
- Run `%setup <maxRolls> <emerald> <diamond>` in Discord so rolls/badge display is correct.
- Firebase URL defaults to the project RTDB; change in settings if needed.
