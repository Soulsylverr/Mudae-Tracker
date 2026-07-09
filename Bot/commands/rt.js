// commands/rt.js
//
// $rt (roll ticket, resets the roll limit early) confirms success through a ✅
// reaction on the user's message. Attribution is as simple as with daily.js.
//
// NOTE: The cooldown for $rt depends on the Emerald Badge level
// (20h/30h/40h/50h). It is currently fixed at 50h (base level); please
// adjust it or make it configurable per user if you have different levels.

const { writeTimer, ensureUserProfile, getEmeraldLevel, refillClaim } = require('../lib/firebase');

function rtCooldownMinutesForEmeraldLevel(level) {
  // Emerald badge reduces $rt cooldown by 10h per level, starting at level 1 = 50h.
  // Game logic:
  // - Level 0: badge locked (we still treat cooldown as base 50h for tracking)
  // - Level 1: 50h
  // - Level 2: 40h
  // - Level 3: 30h
  // - Level 4: 20h
  const clamped = Math.max(0, Math.min(4, Number(level) || 0));
  const effective = clamped === 0 ? 1 : clamped;
  const hours = 60 - effective * 10; // L1=50, L2=40, L3=30, L4=20
  return hours * 60;
}

/**
 * @param {import('discord.js').Message} originalMessage The "$rt" message from the user that Mudae reacted to
 */
async function handleRtReaction(originalMessage) {
  const userId = originalMessage.author.id;
  await ensureUserProfile(userId, originalMessage.author.tag);
  const emerald = await getEmeraldLevel(userId);
  await writeTimer(userId, 'rt', Date.now(), rtCooldownMinutesForEmeraldLevel(emerald));
  await refillClaim(userId);
  console.log(`[rt] ${originalMessage.author.tag} (${userId})`);
}

module.exports = { handleRtReaction, rtCooldownMinutesForEmeraldLevel };
