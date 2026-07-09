// lib/fixedSchedules.js
//
// IMPORTANT: According to Soul, rolls reset, claim reset, and ouroharvest reset
// are not individual cooldowns that start when the command is used; they are
// fixed times. That means we do not need to read a Mudae message for them; pure
// time calculation is enough. This can even run directly in the plugin or web
// app without a bot or Firebase if you want.
//
// PLEASE VERIFY:
// The claim reset anchor hours (17, 20, 23, ...) were inferred from only two
// data points Soul mentioned. Please watch them for a few days to confirm that
// they are really accurate, including your timezone conversion, before relying
// on them blindly.

/**
 * Next rolls reset: every full hour, always at minute :24 UTC.
 * @param {Date} now
 * @returns {Date}
 */
function nextRollsReset(now = new Date()) {
  const next = new Date(now);
  next.setUTCMinutes(24, 0, 0);
  if (next <= now) next.setUTCHours(next.getUTCHours() + 1);
  return next;
}

/**
 * Next claim reset: every 3 hours at minute :24 UTC.
 * Anchor hours according to Soul: 17:24, 20:24, 23:24, 02:24, 05:24, 08:24, 11:24, 14:24
 * -> these are all UTC hours where (hour % 3 === 2).
 * @param {Date} now
 * @returns {Date}
 */
function nextClaimReset(now = new Date()) {
  const ANCHOR_REMAINDER = 2; // 17, 20, 23 mod 3 = 2
  const next = new Date(now);
  next.setUTCMinutes(24, 0, 0);

  const currentHour = next.getUTCHours();
  const hoursToAdd = (ANCHOR_REMAINDER - (currentHour % 3) + 3) % 3;
  next.setUTCHours(currentHour + hoursToAdd);

  if (next <= now) next.setUTCHours(next.getUTCHours() + 3);
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
  start.setUTCMinutes(24, 0, 0);
  if (start > now) start.setUTCHours(start.getUTCHours() - 1);
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
