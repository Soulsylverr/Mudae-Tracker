// lib/fixedSchedules.js
//
// IMPORTANT: According to Soul, rolls reset, claim reset, and ouroharvest reset
// are not individual cooldowns that start when the command is used; they are
// fixed times. That means we do not need to read a Mudae message for them; pure
// time calculation is enough. This can even run directly in the plugin or web
// app without a bot or Firebase if you want.
//
// Anchor hours (17:24, 20:24, 23:24, …) are in the user's local timezone
// (verified for CEST). Mudae resets at minute :24 local time, not UTC.

const ROLL_RESET_MINUTE = 24;
const CLAIM_ANCHOR_REMAINDER = 2; // local hours where (hour % 3 === 2)

/**
 * Next rolls reset: every full hour at minute :24 local time.
 * @param {Date} now
 * @returns {Date}
 */
function nextRollsReset(now = new Date()) {
  const next = new Date(now);
  next.setSeconds(0, 0);
  next.setMilliseconds(0);
  next.setMinutes(ROLL_RESET_MINUTE, 0, 0);
  if (next <= now) next.setHours(next.getHours() + 1);
  return next;
}

/**
 * Next claim reset: every 3 hours at minute :24 local time.
 * Anchor hours: 17:24, 20:24, 23:24, 02:24, 05:24, 08:24, 11:24, 14:24 (local).
 * @param {Date} now
 * @returns {Date}
 */
function nextClaimReset(now = new Date()) {
  const next = new Date(now);
  next.setSeconds(0, 0);
  next.setMilliseconds(0);
  next.setMinutes(ROLL_RESET_MINUTE, 0, 0);

  while (next <= now || next.getHours() % 3 !== CLAIM_ANCHOR_REMAINDER) {
    next.setHours(next.getHours() + 1);
    next.setMinutes(ROLL_RESET_MINUTE, 0, 0);
  }
  return next;
}

/**
 * Next ouroharvest reset: daily at 00:00 UTC.
 * @param {Date} now
 * @returns {Date}
 */
function nextOuroharvestReset(now = new Date()) {
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

/**
 * Start of the current rolls time window (the last :24 time point that has already
 * passed). This is used to tell whether a rolls counter needs to be reset because
 * a new window has begun.
 * @param {Date} now
 * @returns {Date}
 */
function currentRollWindowStart(now = new Date()) {
  const start = new Date(now);
  start.setSeconds(0, 0);
  start.setMilliseconds(0);
  start.setMinutes(ROLL_RESET_MINUTE, 0, 0);
  if (start > now) start.setHours(start.getHours() - 1);
  return start;
}

/**
 * Start of the current claim time window (the last 3h-:24 time point that has
 * already passed). This is used to know whether the "claim already used" state
 * needs to be reset because a new window has begun.
 * @param {Date} now
 * @returns {Date}
 */
function currentClaimWindowStart(now = new Date()) {
  const next = nextClaimReset(now);
  return new Date(next.getTime() - 3 * 60 * 60 * 1000);
}

module.exports = {
  nextRollsReset,
  nextClaimReset,
  nextOuroharvestReset,
  currentRollWindowStart,
  currentClaimWindowStart,
};
