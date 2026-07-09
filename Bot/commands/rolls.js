// commands/rolls.js
//
// $rolls refills roll uses and confirms success through a ✅ reaction on the
// user's message (similar to $rt / $daily).

const { resetRollsUsage, ensureUserProfile } = require('../lib/firebase');

/**
 * @param {import('discord.js').Message} originalMessage The "$rolls" message from the user that Mudae reacted to
 */
async function handleRollsReaction(originalMessage) {
  const userId = originalMessage.author.id;
  await ensureUserProfile(userId, originalMessage.author.tag);
  await resetRollsUsage(userId);
  console.log(`[rolls] ${originalMessage.author.tag} (${userId})`);
}

module.exports = { handleRollsReaction };

