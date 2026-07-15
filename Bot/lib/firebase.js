// lib/firebase.js
//
// Firebase Admin SDK setup. Requires a serviceAccountKey.json in the project root
// (Firebase Console -> Project Settings -> Service Accounts -> Generate new private key).
// Never commit this file (it is listed in .gitignore).

const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const { isTrackedUser } = require('./trackedUsers');

const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));

const databaseURL = process.env.FIREBASE_DATABASE_URL || `https://${serviceAccount.project_id}-default-rtdb.europe-west1.firebasedatabase.app`;

initializeApp({
  credential: cert(serviceAccount),
  databaseURL,
});

const db = getDatabase();

/**
 * Writes a timer state for a user to the database.
 * Path: /users/<userId>/state/<timerName>
 *
 * @param {string} userId Discord user ID
 * @param {string} timerName e.g. 'daily', 'rt', 'dk', 'p'
 * @param {number} timestamp Unix timestamp (ms) of the successful command
 * @param {number} cooldownMinutes Cooldown in minutes from timestamp
 */
async function writeTimer(userId, timerName, timestamp, cooldownMinutes) {
  if (!isTrackedUser(userId)) return;

  const ref = db.ref(`/users/${userId}/state/${timerName}`);
  await ref.set({
    lastUsed: timestamp,
    cooldownMinutes,
    readyAt: timestamp + cooldownMinutes * 60_000,
  });
}

/**
 * Creates a user profile if one does not already exist. This is called
 * automatically the first time a user is seen.
 *
 * @param {string} userId
 * @param {string} username Discord tag; only for readability in the DB
 */
async function ensureUserProfile(userId, username) {
  if (!isTrackedUser(userId)) return;

  const ref = db.ref(`/users/${userId}/meta`);
  const snapshot = await ref.once('value');
  if (!snapshot.exists()) {
    await ref.set({
      username,
      createdAt: Date.now(),
    });
  }
}

/**
 * $oh does not have an individual cooldown; it uses a daily stock that resets
 * at 00:00 UTC (see lib/fixedSchedules.js). That is why we do not write a
 * "readyAt" timer here, but count usage since the last UTC day change.
 *
 * @param {string} userId
 * @param {number} multiplier How much was harvested (parsed from Mudae's message)
 */
async function recordOuroharvestUsage(userId, multiplier) {
  if (!isTrackedUser(userId)) return;

  const ref = db.ref(`/users/${userId}/state/oh`);
  const todayUTC = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

  const snapshot = await ref.once('value');
  const current = snapshot.val();

  if (!current || current.lastResetDate !== todayUTC) {
    // New UTC day: start the counter again
    await ref.set({
      lastResetDate: todayUTC,
      stockUsed: multiplier,
      usesUsed: 1,
      lastUsed: Date.now(),
    });
  } else {
    await ref.update({
      stockUsed: (current.stockUsed || 0) + multiplier,
      usesUsed: (current.usesUsed || 0) + 1,
      lastUsed: Date.now(),
    });
  }
}

/**
 * $oc uses a daily charge that resets at 00:00 UTC (Diamond level 4 = 1/day).
 *
 * @param {string} userId
 */
async function recordOurochestUsage(userId) {
  if (!isTrackedUser(userId)) return;

  const ref = db.ref(`/users/${userId}/state/oc`);
  const todayUTC = new Date().toISOString().slice(0, 10);

  const snapshot = await ref.once('value');
  const current = snapshot.val();

  if (!current || current.lastResetDate !== todayUTC) {
    await ref.set({
      lastResetDate: todayUTC,
      usesUsed: 1,
      lastUsed: Date.now(),
    });
  } else {
    await ref.update({
      usesUsed: (current.usesUsed || 0) + 1,
      lastUsed: Date.now(),
    });
  }
}

/** Daily $oc charges from Diamond badge (1 at level 4, none below). */
function ocDailyLimit(diamondLevel) {
  return Number(diamondLevel) >= 4 ? 1 : 0;
}

const {
  currentRollWindowStart,
  currentClaimWindowStart,
  currentPokeslotWindowStart,
} = require('./fixedSchedules');

const DEFAULT_MAX_ROLLS = 10; // Fallback if no value has been set for a user yet

const DEFAULT_EMERALD_LEVEL = 0;
const DEFAULT_DIAMOND_LEVEL = 0;

async function setUserSetup(userId, { maxRolls, emeraldLevel, diamondLevel }) {
  if (!isTrackedUser(userId)) return;
  const updates = {};
  if (Number.isFinite(maxRolls)) updates['/config/maxRolls'] = maxRolls;
  if (Number.isFinite(emeraldLevel)) {
    updates['/config/emeraldLevel'] = emeraldLevel;
    updates['/config/emeraldStatus'] = emeraldLevel === 0 ? 'Not unlocked yet' : 'Unlocked';
  }
  if (Number.isFinite(diamondLevel)) {
    updates['/config/diamondLevel'] = diamondLevel;
    updates['/config/diamondStatus'] = diamondLevel === 0 ? 'Not unlocked yet' : 'Unlocked';
  }
  await db.ref(`/users/${userId}`).update(updates);
}

async function getEmeraldLevel(userId) {
  if (!isTrackedUser(userId)) return DEFAULT_EMERALD_LEVEL;
  const snapshot = await db.ref(`/users/${userId}/config/emeraldLevel`).once('value');
  return snapshot.exists() ? snapshot.val() : DEFAULT_EMERALD_LEVEL;
}

async function getDiamondLevel(userId) {
  if (!isTrackedUser(userId)) return DEFAULT_DIAMOND_LEVEL;
  const snapshot = await db.ref(`/users/${userId}/config/diamondLevel`).once('value');
  return snapshot.exists() ? snapshot.val() : DEFAULT_DIAMOND_LEVEL;
}

/**
 * Reads the max-rolls value for a user, falling back to DEFAULT_MAX_ROLLS.
 * @param {string} userId
 * @returns {Promise<number>}
 */
async function getMaxRolls(userId) {
  if (!isTrackedUser(userId)) return DEFAULT_MAX_ROLLS;

  const snapshot = await db.ref(`/users/${userId}/config/maxRolls`).once('value');
  return snapshot.exists() ? snapshot.val() : DEFAULT_MAX_ROLLS;
}

/**
 * Counts a successful roll for the user in the current time window.
 * It automatically resets the counter when a new rolls window begins.
 * @param {string} userId
 */
async function recordRollUsage(userId) {
  if (!isTrackedUser(userId)) return;

  const ref = db.ref(`/users/${userId}/state/roll`);
  const windowStartKey = currentRollWindowStart().toISOString();

  const snapshot = await ref.once('value');
  const current = snapshot.val();

  if (!current || current.windowStart !== windowStartKey) {
    await ref.set({
      windowStart: windowStartKey,
      rollsUsed: 1,
      lastUsed: Date.now(),
    });
  } else {
    await ref.update({
      rollsUsed: (current.rollsUsed || 0) + 1,
      lastUsed: Date.now(),
    });
  }
}

async function resetRollsUsage(userId) {
  if (!isTrackedUser(userId)) return;
  const ref = db.ref(`/users/${userId}/state/roll`);
  await ref.set({
    windowStart: currentRollWindowStart().toISOString(),
    rollsUsed: 0,
    lastUsed: Date.now(),
  });
}

/**
 * Marks a user's claim as used in the current 3h window.
 * Consumers (plugin/web app) calculate "hasClaim" themselves via:
 *   hasClaim = (state.lastUsedWindowStart !== currentClaimWindowStart())
 * No reset write is needed; comparing against the current window is enough.
 * @param {string} userId
 */
async function recordClaimUsage(userId) {
  if (!isTrackedUser(userId)) return;

  const ref = db.ref(`/users/${userId}/state/claim`);
  const now = Date.now();
  await ref.set({
    lastUsedWindowStart: currentClaimWindowStart().toISOString(),
    lastUsedAt: now,
  });
}

/**
 * Marks a user's pokeslot as used in the current 2h fixed window.
 * Pokeslot resets at even Berlin hours: 08:00, 10:00, 12:00, ...
 * @param {string} userId
 */
async function recordPokeslotUsage(userId) {
  if (!isTrackedUser(userId)) return;

  const ref = db.ref(`/users/${userId}/state/p`);
  const now = Date.now();
  await ref.set({
    lastUsedWindowStart: currentPokeslotWindowStart().toISOString(),
    lastUsedAt: now,
  });
}

async function refillClaim(userId) {
  if (!isTrackedUser(userId)) return;
  // Any value that is not equal to currentClaimWindowStart() will be treated
  // as "claim available" by consumers that compare windowStart keys.
  const ref = db.ref(`/users/${userId}/state/claim`);
  await ref.set({
    lastUsedWindowStart: `refilled:${Date.now()}`,
    lastUsedAt: Date.now(),
  });
}

/**
 * Records a top.gg vote.
 * Path: /users/<userId>/state/vote
 *
 * NOTE: Unlike the command timers, this is intended to be usable by friends,
 * so it intentionally does NOT enforce isTrackedUser().
 *
 * @param {string} userId Discord user ID
 * @param {number} timestamp Unix timestamp (ms) of the successful vote
 * @param {number} cooldownMinutes top.gg vote cooldown (default 12h)
 */
async function writeVote(userId, timestamp, cooldownMinutes = 12 * 60) {
  if (!userId) return;
  const ref = db.ref(`/users/${userId}/state/vote`);
  await ref.set({
    lastVoted: timestamp,
    cooldownMinutes,
    readyAt: timestamp + cooldownMinutes * 60_000,
  });
}

module.exports = {
  db,
  writeTimer,
  ensureUserProfile,
  recordOuroharvestUsage,
  recordOurochestUsage,
  ocDailyLimit,
  getMaxRolls,
  setUserSetup,
  getEmeraldLevel,
  getDiamondLevel,
  recordRollUsage,
  resetRollsUsage,
  recordClaimUsage,
  recordPokeslotUsage,
  refillClaim,
  writeVote,
};
