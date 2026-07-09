// lib/trackedUsers.js
// Add Discord user IDs here (or via the TRACKED_USER_IDS environment variable)
// Example: TRACKED_USER_IDS=123456789,987654321

const TRACKED_USER_IDS = [
    "269532849898651648", // Soulsylverr
    "705488092072640535", // Soulsylverr2
    "1507072744632881382" // Soulsylverr3
]

function isTrackedUser(userId) {
  return !!userId && TRACKED_USER_IDS.includes(userId);
}

module.exports = {
  TRACKED_USER_IDS,
  isTrackedUser,
};