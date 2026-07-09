// lib/memberNames.js
//
// When claim success is reported, Mudae writes the username as plain text in the
// message (no mention, no reply), for example "Soulsylver and Delutaya are now
// married!". To turn that into the correct Discord ID, we use a map of
// (username/display name in lowercase) -> Discord user ID.
//
// This map is filled once at bot startup from the server's member list. TODO: if
// someone changes their username or nickname mid-session, the map will stay stale
// until the next restart. That is fine for now, but worth knowing.

const nameToId = new Map();

/**
 * Fills the map once with all members of a server.
 * @param {import('discord.js').Guild} guild
 */
async function loadGuildMembers(guild) {
  const members = await guild.members.fetch();
  nameToId.clear();
  for (const member of members.values()) {
    const candidates = [member.user.username, member.user.globalName, member.nickname].filter(Boolean);
    for (const name of candidates) {
      nameToId.set(name.toLowerCase(), member.id);
    }
  }
  console.log(`[memberNames] Loaded ${nameToId.size} name entries for ${members.size} members.`);
}

/**
 * Looks for a known name at the start of a text (case-insensitive).
 * If multiple matches are found, the longest one wins (prevents misattribution
 * when one name is a prefix of another).
 * @param {string} content
 * @returns {string|null} Discord user ID or null
 */
function resolveUserIdFromPrefix(content) {
  const normalized = (content || '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/^[^a-z0-9]+/gi, '')
    .trim()
    .toLowerCase();

  let bestMatch = null;

  for (const [name, userId] of nameToId.entries()) {
    if (normalized.startsWith(name) && (bestMatch === null || name.length > bestMatch.name.length)) {
      bestMatch = { name, userId };
    }
  }

  return bestMatch ? bestMatch.userId : null;
}

module.exports = { loadGuildMembers, resolveUserIdFromPrefix };
