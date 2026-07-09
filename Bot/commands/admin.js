// commands/admin.js
//
// %setup <maxRolls> <EmeraldBadgeLevel> <DiamondBadgeLevel>
// It intentionally uses its own prefix ("%") to avoid colliding with Mudae's "$"
// commands.

const { setUserSetup } = require('../lib/firebase');

const SETUP_REGEX = /^%setup(?:\s+(\d+)\s+([0-4])\s+([0-4]))?$/i;

/**
 * @param {import('discord.js').Message} msg
 */
async function handleSetup(msg) {
  const match = msg.content.trim().match(SETUP_REGEX);
  if (!match) return;

  if (!match[1] && !match[2] && !match[3]) {
    await msg.reply('Usage: `%setup <maxRolls> <EmeraldBadgeLevel 0-4> <DiamondBadgeLevel 0-4>`');
    return;
  }

  const userId = msg.author.id;
  const maxRolls = parseInt(match[1], 10);
  const emeraldLevel = parseInt(match[2], 10);
  const diamondLevel = parseInt(match[3], 10);

  await setUserSetup(userId, { maxRolls, emeraldLevel, diamondLevel });
  await msg.react('✅');
  console.log(
    `[setup] ${msg.author.tag} (${userId}) set maxRolls=${maxRolls}, emerald=${emeraldLevel}, diamond=${diamondLevel}`
  );
}

module.exports = { handleSetup };
