import { countByTwp } from '../repositories/test-guideline.js';
import { findByUsername, countPendingRequests } from '../repositories/user.js';
import { resolveUsername } from '../utils/resolve-user.js';

const TWP_CODES = ['TWA', 'TWF', 'TWO', 'TWV'];
const TC_CODES = ['TC', 'TC-EDC'];

function sum(obj) {
  return Object.values(obj).reduce((a, b) => a + b, 0);
}

function filterCounts(counts, codes) {
  const result = {};
  for (const code of codes) {
    if (counts[code]) result[code] = counts[code];
  }
  return result;
}

/**
 * Get dashboard statistics — scoped to user's role and TWPs.
 */
export const getStats = async (c) => {
  try {
    const username = resolveUsername(c);
    const dbUser = await findByUsername(username);
    const isAdmin = dbUser?.roleCode === 'ADM';
    const userTwpList = isAdmin
      ? TWP_CODES
      : (dbUser?.twps || '').split(',').map((t) => t.trim()).filter(Boolean);

    // Fetch per-TWP counts — only tabs the user can see
    const promises = [
      countByTwp('twp-drafts'),
      countByTwp('archived'),
      isAdmin ? countPendingRequests() : Promise.resolve(0),
    ];
    const [activeCounts, archivedCounts, pendingRequests] = await Promise.all(promises);

    // TWP drafts — filtered to user's TWPs
    const twpDraftCounts = filterCounts(activeCounts, userTwpList);

    // Archived — filtered to user's TWPs (admin sees all including TC)
    const archivedVisible = isAdmin ? [...TWP_CODES, ...TC_CODES] : userTwpList;
    const archivedFiltered = filterCounts(archivedCounts, archivedVisible);

    const stats = {
      twpDrafts: sum(twpDraftCounts),
      archived: sum(archivedFiltered),
      twpCounts: {
        twpDrafts: twpDraftCounts,
        archived: archivedFiltered,
      },
    };

    if (isAdmin) {
      const tcDraftCounts = filterCounts(activeCounts, TC_CODES);
      stats.tcDrafts = sum(tcDraftCounts);
      stats.twpCounts.tcDrafts = tcDraftCounts;
      stats.pendingRequests = pendingRequests;
    }

    return c.json(stats);
  } catch (err) {
    console.error('Get stats error:', err);
    return c.json({ error: { code: 'ERROR', message: 'Failed to get dashboard stats' } }, 500);
  }
};
