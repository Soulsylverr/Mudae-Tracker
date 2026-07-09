// commands/oc.js
//
// $oc has a fixed daily reset at 00:00 UTC (02:00 MESZ). One charge per day at
// Diamond badge level 4. Attribution uses the same pending queue as $oh.

const { recordOurochestUsage, ensureUserProfile } = require('../lib/firebase');
const { resolveAuthor } = require('../lib/attribution');

const SUCCESS_REGEX = /1 red sphere to find/i;

/**
 * @param {import('discord.js').Message} mudaeMsg The message sent by Mudae
 */
async function handleOcMessage(mudaeMsg) {
  const content = mudaeMsg.content;

  const userId = resolveAuthor(mudaeMsg.channel.id, 'oc');
  if (!userId) return;

  if (!SUCCESS_REGEX.test(content)) return;

  await ensureUserProfile(userId, userId);
  await recordOurochestUsage(userId);
  console.log(`[oc] Matched to UID ${userId}.`);
}

module.exports = { handleOcMessage };
