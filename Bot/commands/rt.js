// commands/rt.js
//
// $rt (roll ticket, resets the roll limit early) confirms success through a ✅
// reaction on the user's message. Attribution is as simple as with daily.js.
//
// NOTE: The cooldown for $rt depends on the Emerald Badge level
// (20h/30h/40h/50h). It is currently fixed at 50h (base level); please
// adjust it or make it configurable per user if you have different levels.

const { writeTimer, ensureUserProfile } = require('../lib/firebase');

const RT_COOLDOWN_MINUTES_DEFAULT = 50 * 60;

/**
 * @param {import('discord.js').Message} originalMessage The "$rt" message from the user that Mudae reacted to
 */
async function handleRtReaction(originalMessage) {
  const userId = originalMessage.author.id;
  await ensureUserProfile(userId, originalMessage.author.tag);
  await writeTimer(userId, 'rt', Date.now(), RT_COOLDOWN_MINUTES_DEFAULT);
  console.log(`[rt] ${originalMessage.author.tag} (${userId})`);
}

module.exports = { handleRtReaction, RT_COOLDOWN_MINUTES_DEFAULT };
