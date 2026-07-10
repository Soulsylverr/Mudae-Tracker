// commands/roll.js
//
// Rolls ($w, $h, $m, and their variants) reply with an EMBED (character card)
// on success rather than a reaction or normal text. Attribution still uses the
// same pending queue as dk/p/oh, but this handler checks the embed instead of
// msg.content.

const { recordRollUsage, ensureUserProfile } = require('../lib/firebase');
const { resolveAuthor } = require('../lib/attribution');

// Known roll command variants that all share the same pool.
// This list is taken from the previous BetterDiscord plugin and has already been
// tested live; deliberately no $x, since that is not a roll command.
const ROLL_COMMANDS = ['$ma', '$ha', '$wa', '$mg', '$hg', '$wg', '$m', '$h', '$w'];

// Confirmed by real testing: "{username}, the roulette is limited to X uses
// per hour. Ymin left. Upvote Mudae to reset the timer: $vote. ..."
const FAILURE_REGEX = /the roulette is limited to/i;

/**
 * Checks whether a user message is a roll command (including an optional target
 * name such as "$w lucy"), without falsely matching other commands that share
 * the same prefix (for example "$wp" is wishlist, not a roll).
 * @param {string} content
 * @returns {boolean}
 */
function isRollCommand(content) {
  const text = content.toLowerCase().trim();
  return ROLL_COMMANDS.some((cmd) => text === cmd || text.startsWith(cmd + ' '));
}

/**
 * Checks whether an embed has the typical roll success structure
 * (character card with claims/likes information).
 * @param {import('discord.js').Embed} embed
 * @returns {boolean}
 */
function isRollEmbed(embed) {
  const description = embed.description || '';
  return /react with any emoji to claim/i.test(description);
}

/**
 * @param {import('discord.js').Message} mudaeMsg The message sent by Mudae
 */
async function handleRollMessage(mudaeMsg) {
  if (mudaeMsg.embeds.length > 0 && isRollEmbed(mudaeMsg.embeds[0])) {
    const userId = resolveAuthor(mudaeMsg.channel.id, 'roll');
    if (!userId) {
      console.warn('[roll] No pending entry was found, so nothing could be matched.');
      return;
    }
    await ensureUserProfile(userId, userId);
    await recordRollUsage(userId);
    console.log(`[roll] Matched to UID ${userId}.`);
    return;
  }

  if (FAILURE_REGEX.test(mudaeMsg.content)) {
    // The rolls for this window are exhausted; we still consume the pending entry
    // to keep the queue from getting clogged. No counter write is needed.
    resolveAuthor(mudaeMsg.channel.id, 'roll');
  }
}

module.exports = { handleRollMessage, isRollCommand };
