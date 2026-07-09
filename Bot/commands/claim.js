// commands/claim.js
//
// Claim success comes as a plain-text message with the username at the start,
// for example "Soulsylver and Delutaya are now married!" or
// "Soulsylver high rolled with Delutaya once again!" - no mention and no
// reply. Attribution therefore goes through lib/memberNames.js instead of the
// pending queue (there is no triggering command to track beforehand; claiming
// happens through a reaction on the roll, not via a text command).

const { recordClaimUsage, ensureUserProfile } = require('../lib/firebase');
const { loadGuildMembers, resolveUserIdFromPrefix } = require('../lib/memberNames');

const CLAIM_SUCCESS_PATTERNS = [/are now married\b/i, /high rolled with .+ once again\b/i];

function isClaimSuccessMessage(content) {
  return CLAIM_SUCCESS_PATTERNS.some((pattern) => pattern.test(content.trim()));
}

/**
 * @param {import('discord.js').Message} mudaeMsg The message sent by Mudae
 */
async function handleClaimMessage(mudaeMsg) {
  const content = mudaeMsg.content;
  if (!isClaimSuccessMessage(content)) return;

  let userId = resolveUserIdFromPrefix(content);
  if (!userId && mudaeMsg.guild) {
    await loadGuildMembers(mudaeMsg.guild);
    userId = resolveUserIdFromPrefix(content);
  }

  if (!userId) {
    console.warn(`[claim] Could not match the username at the start of "${content}" to a known member.`);
    return;
  }

  await ensureUserProfile(userId, userId);
  await recordClaimUsage(userId);
  console.log(`[claim] Matched to UID ${userId}.`);
}

module.exports = { handleClaimMessage, isClaimSuccessMessage };
