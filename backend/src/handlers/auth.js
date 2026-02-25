import axios from 'axios';
import { findByUsername } from '../repositories/user.js';
import { getProvider } from '../utils/oauth-providers.js';

/**
 * Exchange authorization code for tokens
 * Delegates to the correct provider based on request body
 */
export const exchangeToken = async (c) => {
  try {
    const body = await c.req.json();
    const { code, redirect_uri, provider: providerName = 'forgerock' } = body;

    if (!code) {
      return c.json({ error: { code: 'BAD_REQUEST', message: 'Authorization code required' } }, 400);
    }

    const provider = getProvider(providerName);
    const redirectUri = redirect_uri || process.env.OIDC_REDIRECT_URI;

    console.log(`Exchanging code for token via ${providerName}`);

    const tokenData = await provider.exchangeToken(code, redirectUri);

    console.log(`Token exchange successful (${providerName})`);

    return c.json({
      ...tokenData,
      provider: providerName,
    });
  } catch (err) {
    console.error('Token exchange error:', err.response?.data || err.message);
    return c.json({ error: { code: 'AUTH_FAILED', message: 'Token exchange failed' } }, 401);
  }
};

/**
 * Get user info from WIPO OAuth userinfo endpoint
 * ForgeRock-only debugging endpoint
 */
export const getUserInfo = async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, 401);
    }

    const accessToken = authHeader.substring(7);
    const userInfoUrl = process.env.OIDC_USERINFO_URI;

    console.log(`Fetching user info from ${userInfoUrl}`);

    const response = await axios.get(userInfoUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    const userInfo = response.data;
    console.log('User info received:', userInfo.sub);

    return c.json({
      sub: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      country: userInfo.country,
    });
  } catch (err) {
    console.error('Get user info error:', err.response?.data || err.message);
    return c.json({ error: { code: 'AUTH_FAILED', message: 'Failed to get user info' } }, 401);
  }
};

/**
 * Get current user info (combines OAuth identity + database roles)
 *
 * In DEV_BYPASS_AUTH mode, returns mock user from database lookup.
 * EntraID users always receive ADMIN role regardless of database value.
 */
export const getMe = async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, 401);
    }

    const accessToken = authHeader.substring(7);

    // Dev bypass mode - use mock user
    if (process.env.DEV_BYPASS_AUTH === 'true') {
      const mockUsername = process.env.DEV_MOCK_USER || 'devuser';
      console.log(`[DEV MODE] Getting user info for: ${mockUsername}`);

      const dbUser = await findByUsername(mockUsername);

      if (dbUser) {
        return c.json({
          id: dbUser.id,
          username: dbUser.userName,
          name: dbUser.fullName,
          email: dbUser.email,
          roles: dbUser.roleCode ? [dbUser.roleCode] : [],
          isDevMode: true,
        });
      }

      // Return mock data if user not in database
      return c.json({
        id: null,
        username: mockUsername,
        name: 'Dev User',
        email: `${mockUsername}@wipo.int`,
        roles: ['ADMIN', 'LE'], // Give all roles in dev mode
        isDevMode: true,
        isNewUser: true,
      });
    }

    // Production mode - determine provider from header
    const providerName = c.req.header('X-Auth-Provider') || 'forgerock';
    const provider = getProvider(providerName);

    // Validate token and extract identity
    const tokenData = await provider.verifyToken(accessToken);
    const identity = provider.getUserIdentity(tokenData);

    console.log(`getMe: ${identity.username} via ${providerName}`);

    // Look up user in database
    const dbUser = await findByUsername(identity.username);

    if (!dbUser) {
      return c.json({
        id: null,
        username: identity.username,
        name: identity.name || identity.username,
        email: identity.email,
        country: identity.country,
        roles: providerName === 'entraid' ? ['ADMIN'] : [],
        authProvider: providerName,
        isNewUser: true,
      });
    }

    // EntraID users always get ADMIN role
    const roles = providerName === 'entraid'
      ? ['ADMIN']
      : (dbUser.roleCode ? [dbUser.roleCode] : []);

    return c.json({
      id: dbUser.id,
      username: identity.username,
      name: dbUser.fullName || identity.name,
      email: dbUser.email || identity.email,
      country: identity.country,
      roles,
      authProvider: providerName,
      isNewUser: false,
    });
  } catch (err) {
    console.error('Get user error:', err.response?.data || err.message);
    if (err.response?.status === 401 || err.message?.includes('expired') || err.message?.includes('invalid')) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'Token expired or invalid' } }, 401);
    }
    return c.json({ error: { code: 'ERROR', message: 'Failed to get user info' } }, 500);
  }
};
