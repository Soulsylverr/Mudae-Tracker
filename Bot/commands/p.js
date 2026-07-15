// commands/p.js
//
// $p can have many different success texts depending on the reward, so they do
// not fit neatly into a single regex. For that reason, success is treated as
// "anything that is not the cooldown text". This is a practical compromise.
//
// IMPORTANT NOTE: Because Mudae does not use replies, we cannot be 100% sure
// that this exact Mudae message is the reply to $p and not, for example, a
// parallel roll message in the same channel. If you use Mudae commands in a
// dedicated channel, that risk is reduced significantly.

const { recordPokeslotUsage, ensureUserProfile } = require('../lib/firebase');
const { resolveAuthor } = require('../lib/attribution');

const COOLDOWN_REGEX = /remaining time before your next \$p/i;

/**
 * @param {import('discord.js').Message} mudaeMsg The message sent by Mudae
 */
async function handlePMessage(mudaeMsg) {
  const content = mudaeMsg.content;

  // Only react when a $p is actually pending, which reduces misattribution from
  // other independent Mudae messages in the channel.
  const userId = resolveAuthor(mudaeMsg.channel.id, 'p');
  if (!userId) return;

  if (COOLDOWN_REGEX.test(content)) {
    // Cooldown is active, so no new timer is needed.
    return;
  }

  await ensureUserProfile(userId, userId);
  await recordPokeslotUsage(userId);
  console.log(`[p] Matched to UID ${userId}.`);
}

module.exports = { handlePMessage };
