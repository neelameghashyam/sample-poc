import axios from 'axios';

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
    // ForgeRock's 'name' field is the username; build full name from given_name + family_name
    const name = userInfo.given_name && userInfo.family_name
      ? `${userInfo.family_name} ${userInfo.given_name}`
      : userInfo.name;

    return {
      username: userInfo.sub,
      email: userInfo.email,
      name,
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
    try {
      const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Token expired or invalid');
      }
      throw new Error(`EntraID token validation failed: ${error.message}`);
    }
  },

  getUserIdentity(profile) {
    // Strip @wipo.int domain from userPrincipalName for DB lookup
    let username = profile.userPrincipalName || profile.mail || profile.id;
    username = username.replace(/@wipo\.int$/i, '').toUpperCase();

    return {
      username,
      email: profile.mail || profile.userPrincipalName,
      name: profile.displayName,
      country: profile.officeLocation,
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
