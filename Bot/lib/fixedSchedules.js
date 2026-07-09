// lib/fixedSchedules.js
//
// Rolls and claim windows use Europe/Berlin wall clock (:24 past the hour).
// Ouroharvest resets at 00:00 UTC (02:00 MESZ).

const SCHEDULE_TZ = 'Europe/Berlin';
const ROLL_RESET_MINUTE = 24;
const CLAIM_ANCHOR_REMAINDER = 2; // 17:24, 20:24, 23:24, … Berlin time

function berlinParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: SCHEDULE_TZ,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date);
  const pick = (type) => parseInt(parts.find((p) => p.type === type).value, 10);
  return {
    year: pick('year'),
    month: pick('month'),
    day: pick('day'),
    hour: pick('hour'),
    minute: pick('minute'),
    second: pick('second'),
  };
}

function utcFromBerlin(year, month, day, hour, minute, second = 0) {
  const base = Date.UTC(year, month - 1, day, hour, minute, second);
  for (let offset = -3 * 3_600_000; offset <= 3 * 3_600_000; offset += 3_600_000) {
    const candidate = new Date(base + offset);
    const p = berlinParts(candidate);
    if (
      p.year === year &&
      p.month === month &&
      p.day === day &&
      p.hour === hour &&
      p.minute === minute &&
      p.second === second
    ) {
      return candidate;
    }
  }
  throw new Error(`utcFromBerlin: could not resolve ${year}-${month}-${day} ${hour}:${minute}`);
}

function atBerlinMinute(date, minute = ROLL_RESET_MINUTE) {
  const p = berlinParts(date);
  return utcFromBerlin(p.year, p.month, p.day, p.hour, minute, 0);
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 3_600_000);
}

/** Next rolls reset: every full hour at :24 Berlin time. */
function nextRollsReset(now = new Date()) {
  let candidate = atBerlinMinute(now);
  if (candidate <= now) candidate = addHours(candidate, 1);
  return atBerlinMinute(candidate);
}

/** Next claim reset: every 3 hours at :24 Berlin time. */
function nextClaimReset(now = new Date()) {
  let candidate = atBerlinMinute(now);
  if (candidate <= now) candidate = atBerlinMinute(addHours(candidate, 1));

  while (candidate <= now || berlinParts(candidate).hour % 3 !== CLAIM_ANCHOR_REMAINDER) {
    candidate = atBerlinMinute(addHours(candidate, 1));
  }
  return candidate;
}

/** Next ouroharvest reset: daily at 00:00 UTC. */
function nextOuroharvestReset(now = new Date()) {
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

/** Start of the current rolls window (last :24 Berlin time that has passed). */
function currentRollWindowStart(now = new Date()) {
  return addHours(nextRollsReset(now), -1);
}

/** Start of the current claim window (last 3h :24 Berlin anchor that has passed). */
function currentClaimWindowStart(now = new Date()) {
  return addHours(nextClaimReset(now), -3);
}

module.exports = {
  SCHEDULE_TZ,
  berlinParts,
  nextRollsReset,
  nextClaimReset,
  nextOuroharvestReset,
  currentRollWindowStart,
  currentClaimWindowStart,
};
