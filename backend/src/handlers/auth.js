import axios from 'axios';
import { findByUsername, findUserById, syncUserIdentity, createEntraIdUser } from '../repositories/user.js';
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
 * EntraID users always receive ADMIN role regardless of database value.
 */
export const getMe = async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, 401);
    }

    const accessToken = authHeader.substring(7);

    // Determine provider from header
    const providerName = c.req.header('X-Auth-Provider') || 'forgerock';
    const provider = getProvider(providerName);

    // getMe needs full profile (email, name, country) for user sync,
    // so use fetchUserInfo when available (ForgeRock) instead of JWT-only verifyToken
    const tokenData = provider.fetchUserInfo
      ? await provider.fetchUserInfo(accessToken)
      : await provider.verifyToken(accessToken);
    const identity = provider.getUserIdentity(tokenData);

    console.log(`getMe: ${identity.username} via ${providerName}`);

    // Look up user in database
    let dbUser = await findByUsername(identity.username);

    if (!dbUser && providerName === 'entraid') {
      // Auto-provision EntraID users as active admins
      const fullName = identity.name || identity.username;
      const email = identity.email || '';
      const result = await createEntraIdUser({ userName: identity.username, fullName, email });
      // Re-fetch so the response is built from DB (single source of truth)
      dbUser = await findUserById(result.insertId);
    }

    if (!dbUser) {
      return c.json({
        id: null,
        username: identity.username,
        name: identity.name || identity.username,
        email: identity.email,
        country: identity.country,
        roles: [],
        authProvider: providerName,
        isNewUser: true,
        needsAccessRequest: true,
        isPending: false,
      });
    }

    // Sync SSO identity (name, email) and last login timestamp on every login
    const ssoName = identity.name || dbUser.fullName;
    const ssoEmail = identity.email || dbUser.email;
    await syncUserIdentity(dbUser.id, { fullName: ssoName, email: ssoEmail });

    // EntraID users always get ADM role; others use DB role
    const roles = providerName === 'entraid'
      ? ['ADM']
      : (dbUser.roleCode ? [dbUser.roleCode] : []);

    // EntraID users bypass access request workflow
    const needsAccessRequest = providerName === 'entraid'
      ? false
      : (dbUser.statusCode === 'I' && (dbUser.requestStatus === 'Rejected' || !dbUser.twps));
    const isPending = providerName === 'entraid'
      ? false
      : (dbUser.statusCode === 'I' && dbUser.requestStatus === 'Pending');

    return c.json({
      id: dbUser.id,
      username: identity.username,
      name: ssoName,
      email: ssoEmail,
      country: identity.country,
      roles,
      authProvider: providerName,
      isNewUser: false,
      statusCode: dbUser.statusCode,
      requestStatus: dbUser.requestStatus,
      officeCode: dbUser.officeCode,
      twps: dbUser.twps,
      needsAccessRequest,
      isPending,
    });
  } catch (err) {
    console.error('Get user error:', err.response?.data || err.message);
    if (err.response?.status === 401 || err.message?.includes('expired') || err.message?.includes('invalid')) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'Token expired or invalid' } }, 401);
    }
    return c.json({ error: { code: 'ERROR', message: 'Failed to get user info' } }, 500);
  }
};
