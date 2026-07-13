# Mudae Tracker Display (Browser Extension)

This extension mirrors the BetterDiscord Mudae tracker HUD in a regular browser tab so you can view the same Firebase-backed data on non-client devices.

## Setup

1. Open `chrome://extensions` and enable Developer mode.
2. Choose “Load unpacked” and point it at the `BrowserExtensionDisplay` folder.
3. Open the extension options and set:
   - your Firebase URL
   - your Discord user ID
4. Open the display tab from the popup or the options page.

The display logic follows the same schedule math and UI behavior as the BetterDiscord plugin, with adjustments for browser-based execution.
