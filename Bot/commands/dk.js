// commands/dk.js
//
// $dk replies with a new text message without a reply reference or mention.
// Attribution is handled through the pending queue in lib/attribution.js.
// That queue is filled in index.js when a user sends "$dk".

const { writeTimer, ensureUserProfile } = require('../lib/firebase');
const { resolveAuthor } = require('../lib/attribution');

const DK_COOLDOWN_MINUTES = 20 * 60; // please verify this against your server value

const SUCCESS_REGEX = /added to your kakera collection/i;
const COOLDOWN_REGEX = /next \$dk in/i;

/**
 * @param {import('discord.js').Message} mudaeMsg The message sent by Mudae
 */
async function handleDkMessage(mudaeMsg) {
  const content = mudaeMsg.content;

  if (SUCCESS_REGEX.test(content)) {
    const userId = resolveAuthor(mudaeMsg.channel.id, 'dk');
    if (!userId) {
      console.warn('[dk] No pending entry was found, so nothing could be matched.');
      return;
    }
    await ensureUserProfile(userId, userId);
    await writeTimer(userId, 'dk', Date.now(), DK_COOLDOWN_MINUTES);
    console.log(`[dk] Matched to UID ${userId}.`);
    return;
  }

  if (COOLDOWN_REGEX.test(content)) {
    // The command did not go through because the cooldown was still active.
    // We still consume the pending entry so the queue does not get clogged with stale items.
    resolveAuthor(mudaeMsg.channel.id, 'dk');
  }
}

module.exports = { handleDkMessage, DK_COOLDOWN_MINUTES };
