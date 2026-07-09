// lib/parsing.js
//
// Shared helper for parsing Mudae's "Xh Ymin" time format from free text.
// It is not currently needed for rt/claim/oh (those are fixed and calculable,
// see fixedSchedules.js), but it remains useful for dk/p cooldown text if you
// want to read the "time left" display directly from the Mudae reply instead of
// calculating it yourself.

const TIME_LEFT_REGEX = /(?:(\d+)\s*h)?\s*(\d+)\s*min/i;

/**
 * Extracts an "Xh Ymin" value from a string and returns the total minutes, or
 * null if nothing was found.
 * @param {string} text
 * @returns {number|null}
 */
function parseCooldownMinutes(text) {
  const match = text.match(TIME_LEFT_REGEX);
  if (!match) return null;
  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = parseInt(match[2], 10);
  return hours * 60 + minutes;
}

module.exports = { parseCooldownMinutes };
