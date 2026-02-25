import axios from 'axios';
import { createRemoteJWKSet, jwtVerify } from 'jose';

// Cache the JWKS for EntraID
let entraidJwks = null;

const forgerock = {
  name: 'forgerock',

  async exchangeToken(code, redirectUri) {
    const tokenUrl = process.env.OIDC_TOKEN_URI;
    const clientId = process.env.OIDC_CLIENT_ID;
    const clientSecret = process.env.OIDC_CLIENT_SECRET;
    const finalRedirectUri = redirectUri || process.env.OIDC_REDIRECT_URI;

    const encodedAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await axios.post(
      tokenUrl,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: finalRedirectUri,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${encodedAuth}`,
        },
      }
    );

    return {
      access_token: response.data.access_token,
      id_token: response.data.id_token,
      refresh_token: response.data.refresh_token,
      expires_in: response.data.expires_in,
      token_type: 'Bearer',
    };
  },

  async verifyToken(token) {
    const userInfoUrl = process.env.OIDC_USERINFO_URI;
    if (!userInfoUrl) {
      throw new Error('OIDC_USERINFO_URI not configured');
    }

    try {
      const response = await axios.get(userInfoUrl, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Token expired or invalid');
      }
      throw new Error(`Token validation failed: ${error.message}`);
    }
  },

  getUserIdentity(userInfo) {
    return {
      username: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      country: userInfo.country,
    };
  },
};

const entraid = {
  name: 'entraid',

  async exchangeToken(code, redirectUri) {
    const tenantId = process.env.ENTRAID_TENANT_ID;
    const clientId = process.env.ENTRAID_CLIENT_ID;
    const clientSecret = process.env.ENTRAID_CLIENT_SECRET;
    const scopes = process.env.ENTRAID_SCOPES || 'openid profile email User.Read';

    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    const response = await axios.post(
      tokenUrl,
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        scope: scopes,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    return {
      access_token: response.data.access_token,
      id_token: response.data.id_token,
      refresh_token: response.data.refresh_token,
      expires_in: response.data.expires_in,
      token_type: 'Bearer',
    };
  },

  async verifyToken(token) {
    const tenantId = process.env.ENTRAID_TENANT_ID;
    const clientId = process.env.ENTRAID_CLIENT_ID;

    if (!tenantId || !clientId) {
      throw new Error('ENTRAID_TENANT_ID and ENTRAID_CLIENT_ID must be configured');
    }

    const jwksUrl = new URL(`https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`);

    if (!entraidJwks) {
      entraidJwks = createRemoteJWKSet(jwksUrl);
    }

    try {
      const { payload } = await jwtVerify(token, entraidJwks, {
        issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
        audience: clientId,
      });
      return payload;
    } catch (error) {
      throw new Error(`EntraID token validation failed: ${error.message}`);
    }
  },

  getUserIdentity(claims) {
    // Strip @wipo.int domain from preferred_username for DB lookup
    let username = claims.preferred_username || claims.sub;
    username = username.replace(/@wipo\.int$/i, '').toUpperCase();

    return {
      username,
      email: claims.email || claims.preferred_username,
      name: claims.name,
      country: claims.country,
    };
  },
};

const providers = { forgerock, entraid };

export const getProvider = (name = 'forgerock') => {
  const provider = providers[name];
  if (!provider) {
    throw new Error(`Unknown auth provider: ${name}`);
  }
  return provider;
};
