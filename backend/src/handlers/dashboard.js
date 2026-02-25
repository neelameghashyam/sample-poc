import { getStats as getStatsFromDb } from '../repositories/test-guideline.js';

/**
 * Get dashboard statistics
 */
export const getStats = async (c) => {
  try {
    const stats = await getStatsFromDb();
    return c.json(stats);
  } catch (err) {
    console.error('Get stats error:', err);
    return c.json({ error: { code: 'ERROR', message: 'Failed to get dashboard stats' } }, 500);
  }
};
