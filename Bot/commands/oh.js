// commands/oh.js
//
// $oh has a fixed daily reset (00:00 UTC, see lib/fixedSchedules.js) and no
// individual cooldown. We therefore write a stock counter instead of a
// "readyAt" timer, tracking how much has already been harvested today.
//
// OPEN QUESTION (please verify): The success message shows buttons to click
// (Discord components). Does a messageUpdate (edit) or a new message happen
// after clicking? If so, we should also listen for 'messageUpdate' to capture
// the actual completion of the harvest instead of only the start. At the moment,
// this handler counts the usage as soon as the success message appears.

const { recordOuroharvestUsage, ensureUserProfile } = require('../lib/firebase');
const { resolveAuthor } = require('../lib/attribution');

const SUCCESS_REGEX = /you can click .* times/i;
const COOLDOWN_REGEX = /you don't have enough \$oh for today/i;
const MULTIPLIER_REGEX = /multiplier:\s*(\d+)x/i;

/**
 * @param {import('discord.js').Message} mudaeMsg The message sent by Mudae
 */
async function handleOhMessage(mudaeMsg) {
  const content = mudaeMsg.content;

  const userId = resolveAuthor(mudaeMsg.channel.id, 'oh');
  if (!userId) return;

  if (COOLDOWN_REGEX.test(content)) {
    // No stock is left; the reset happens at 00:00 UTC anyway, so no write is needed.
    return;
  }

  if (SUCCESS_REGEX.test(content)) {
    const multiplierMatch = content.match(MULTIPLIER_REGEX);
    const multiplier = multiplierMatch ? parseInt(multiplierMatch[1], 10) : 1;

    await ensureUserProfile(userId, userId);
    await recordOuroharvestUsage(userId, multiplier);
    console.log(`[oh] Matched to UID ${userId}; stock increased by ${multiplier}.`);
  }
}

module.exports = { handleOhMessage };
