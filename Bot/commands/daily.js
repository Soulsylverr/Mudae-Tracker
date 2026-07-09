// commands/daily.js
//
// $daily confirms success through a ✅ reaction on the user's own message,
// not through a new text message. Attribution is therefore simple: the author
// of the reacted message is the user who executed the command.

const { writeTimer, ensureUserProfile } = require('../lib/firebase');

const DAILY_COOLDOWN_MINUTES = 20 * 60; // 20h; adjust if your server uses a different setting

/**
 * @param {import('discord.js').Message} originalMessage The "$daily" message from the user that Mudae reacted to
 */
async function handleDailyReaction(originalMessage) {
  const userId = originalMessage.author.id;
  await ensureUserProfile(userId, originalMessage.author.tag);
  await writeTimer(userId, 'daily', Date.now(), DAILY_COOLDOWN_MINUTES);
  console.log(`[daily] ${originalMessage.author.tag} (${userId})`);
}

module.exports = { handleDailyReaction, DAILY_COOLDOWN_MINUTES };
