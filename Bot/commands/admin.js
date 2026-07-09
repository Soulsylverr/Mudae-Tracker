// commands/admin.js
//
// %setrolls <@user> <amount> - sets the max-rolls value for a user.
// It intentionally uses its own prefix ("%") to avoid colliding with Mudae's "$"
// commands.

const { setMaxRolls } = require('../lib/firebase');

const SETROLLS_REGEX = /^%setrolls(?:\s+(?:<@!?(\d+)>|(\d+))\s+(\d+))?$/i;

/**
 * @param {import('discord.js').Message} msg
 */
async function handleSetRolls(msg) {
  const match = msg.content.trim().match(SETROLLS_REGEX);
  if (!match) return;

  if (!match[1] && !match[2] && !match[3]) {
    await msg.reply('Usage: `%setrolls <@user|userId> <amount>`');
    return;
  }

  const targetUserId = match[1] || match[2];
  const maxRolls = parseInt(match[3], 10);

  await setMaxRolls(targetUserId, maxRolls);
  await msg.react('✅');
  console.log(`[admin] Max rolls for ${targetUserId} set to ${maxRolls} by ${msg.author.tag}.`);
}

module.exports = { handleSetRolls };
