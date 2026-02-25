import { getProvider } from '../utils/oauth-providers.js';

/**
 * Verify access token using the appropriate provider
 * ForgeRock: opaque token validated via userinfo endpoint
 * EntraID: JWT validated via JWKS
 */
export const verifyToken = async (token, providerName = 'forgerock') => {
  const provider = getProvider(providerName);
  return provider.verifyToken(token);
};

/**
 * Hono auth middleware
 * Validates token or bypasses in dev mode
 * Reads X-Auth-Provider header to determine validation strategy
 */
export const authMiddleware = async (c, next) => {
  // Dev bypass mode - skip OAuth validation
  if (process.env.DEV_BYPASS_AUTH === 'true') {
    c.set('user', {
      sub: process.env.DEV_MOCK_USER || 'devuser',
      email: `${process.env.DEV_MOCK_USER || 'devuser'}@wipo.int`,
      name: 'Dev User',
    });
    c.set('authProvider', 'forgerock');
    console.log(`[DEV MODE] Bypassing auth for user: ${c.get('user').sub}`);
    return next();
  }

  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, 401);
  }

  const providerName = c.req.header('X-Auth-Provider') || 'forgerock';

  try {
    const user = await verifyToken(token, providerName);
    c.set('user', user);
    c.set('authProvider', providerName);
    return next();
  } catch (error) {
    console.error(`Auth error (${providerName}):`, error.message);
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } }, 401);
  }
};

/**
 * Lambda Authorizer handler
 * Validates token and returns IAM policy
 * Reads x-auth-provider header from event to determine validation strategy
 */
export const authorizer = async (event) => {
  const token = event.authorizationToken?.replace('Bearer ', '');

  if (!token) {
    console.log('No token provided');
    return generatePolicy('user', 'Deny', event.methodArn);
  }

  // HTTP API v2 format: headers are in event.headers
  const providerName = event.headers?.['x-auth-provider'] || 'forgerock';

  try {
    const userInfo = await verifyToken(token, providerName);

    const provider = getProvider(providerName);
    const identity = provider.getUserIdentity(userInfo);

    console.log(`Authorized user: ${identity.username} (${providerName})`);

    return generatePolicy(identity.username, 'Allow', event.methodArn, {
      sub: identity.username,
      email: identity.email,
      name: identity.name,
      authProvider: providerName,
    });
  } catch (error) {
    console.error(`Authorization failed (${providerName}):`, error.message);
    return generatePolicy('user', 'Deny', event.methodArn);
  }
};

/**
 * Generate IAM policy for Lambda Authorizer
 */
const generatePolicy = (principalId, effect, resource, context = {}) => ({
  principalId,
  policyDocument: {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: resource,
      },
    ],
  },
  context,
});
