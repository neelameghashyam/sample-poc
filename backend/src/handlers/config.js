/**
 * GET /api/config — public endpoint returning non-secret frontend config.
 * Enables a single frontend build artifact across all environments.
 */
export function getConfig(c) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  return c.json({
    auth: {
      devBypass: process.env.DEV_BYPASS_AUTH === 'true',
      oidc: {
        authorizationUri: process.env.OIDC_AUTHORIZATION_URI || '',
        clientId: process.env.OIDC_CLIENT_ID || '',
        redirectUri: process.env.OIDC_REDIRECT_URI || `${frontendUrl}/auth/callback`,
        scopes: process.env.OIDC_SCOPES || 'openid email profile office address',
      },
      entraid: {
        tenantId: process.env.ENTRAID_TENANT_ID || '',
        clientId: process.env.ENTRAID_CLIENT_ID || '',
        redirectUri: `${frontendUrl}/auth/callback`,
        scopes: process.env.ENTRAID_SCOPES || 'openid profile email User.Read',
      },
    },
    tinymce: {
      apiKey: process.env.TINY_API_KEY || '',
    },
  });
}
