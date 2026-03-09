import { findByUsername, updateTwps, assignUserToMatchingTgs } from '../repositories/user.js';
import { getProvider } from '../utils/oauth-providers.js';

const VALID_TWPS = ['TWA', 'TWF', 'TWO', 'TWV'];

/**
 * Update current user's TWPs and re-assign IE TGs
 */
export const updateMyTwps = async (c) => {
  try {
    const body = await c.req.json();
    const { twps } = body;

    if (!twps || typeof twps !== 'string') {
      return c.json({ error: { code: 'BAD_REQUEST', message: 'TWPs are required' } }, 400);
    }

    const twpList = twps.split(',').map((t) => t.trim()).filter(Boolean);
    if (twpList.length === 0 || !twpList.every((t) => VALID_TWPS.includes(t))) {
      return c.json({ error: { code: 'BAD_REQUEST', message: 'Invalid TWP value' } }, 400);
    }

    // Resolve current user
    let username;
    if (process.env.DEV_BYPASS_AUTH === 'true') {
      username = process.env.DEV_MOCK_USER || 'devuser';
    } else {
      const authUser = c.get('user');
      const providerName = c.get('authProvider') || 'forgerock';
      const provider = getProvider(providerName);
      username = provider.getUserIdentity(authUser).username;
    }

    const dbUser = await findByUsername(username);
    if (!dbUser) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, 404);
    }

    const normalizedTwps = twpList.join(',');
    await updateTwps(dbUser.id, normalizedTwps);

    // Auto-assign as IE to TGs matching new TWPs
    const assigned = await assignUserToMatchingTgs(dbUser.id, normalizedTwps);
    console.log(`Profile TWP update: user ${dbUser.id} → ${normalizedTwps}, assigned to ${assigned} new TG(s)`);

    return c.json({ message: 'TWPs updated', twps: normalizedTwps, assigned });
  } catch (err) {
    console.error('Update TWPs error:', err);
    return c.json({ error: { code: 'ERROR', message: 'Failed to update TWPs' } }, 500);
  }
};
