// lib/attribution.js
//
// Problem: Mudae does not use Discord replies for $dk, $p, or $oh.
// That means we cannot tell directly which user's message Mudae is answering.
//
// Solution: use a FIFO queue per (channel, command). When a user sends, for
// example, "$dk", we create a pending entry. The next matching Mudae text reply
// in that channel is assigned to the oldest open entry.
//
// Limitation: if two people in the same channel send the same command within a
// split second, the assignment can occasionally be wrong. In a small friend
// group that is unlikely in practice, but worth knowing.

const PENDING_TIMEOUT_MS = 10_000; // Drop a pending entry after 10 seconds

// Map<`${channelId}:${command}`, Array<{ userId: string, timestamp: number }>>
const pendingQueues = new Map();

function queueKey(channelId, command) {
  return `${channelId}:${command}`;
}

function cleanupExpired(key) {
  const queue = pendingQueues.get(key);
  if (!queue) return;
  const now = Date.now();
  while (queue.length && now - queue[0].timestamp > PENDING_TIMEOUT_MS) {
    queue.shift();
  }
}

/**
 * Registers that a user sent a command.
 * @param {string} channelId
 * @param {string} userId
 * @param {string} command e.g. 'dk', 'p', 'oh'
 */
function trackCommand(channelId, userId, command) {
  const key = queueKey(channelId, command);
  if (!pendingQueues.has(key)) pendingQueues.set(key, []);
  cleanupExpired(key);
  pendingQueues.get(key).push({ userId, timestamp: Date.now() });
}

/**
 * Retrieves and removes the oldest open pending entry for this command in the
 * channel. Returns the userId, or null if nothing matching is currently pending.
 * @param {string} channelId
 * @param {string} command
 * @returns {string|null}
 */
function resolveAuthor(channelId, command) {
  const key = queueKey(channelId, command);
  cleanupExpired(key);
  const queue = pendingQueues.get(key);
  if (!queue || queue.length === 0) return null;
  const entry = queue.shift();
  return entry.userId;
}

module.exports = { trackCommand, resolveAuthor };
