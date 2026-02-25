import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';
import type { User, AuthProvider, TokenResponse } from '@/types';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));
  const authProvider = ref<AuthProvider | null>(
    (localStorage.getItem('auth_provider') as AuthProvider) || null,
  );

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.roles?.includes('ADMIN') ?? false);

  /** Redirect to ForgeRock OAuth */
  function loginForgeRock(): void {
    const authorizationUri = import.meta.env.VITE_OIDC_AUTHORIZATION_URI || 'https://logindev.wipo.int:443/am/oauth2/authorize';
    const clientId = import.meta.env.VITE_OIDC_CLIENT_ID || 'upovtg';
    const redirectUri = import.meta.env.VITE_OIDC_REDIRECT_URI || `${window.location.origin}/auth/callback`;
    const scopes = import.meta.env.VITE_OIDC_SCOPES || 'openid email profile office address';

    const state = btoa(JSON.stringify({ provider: 'forgerock' }));

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes,
      state,
    });
    window.location.href = `${authorizationUri}?${params}`;
  }

  /** Redirect to EntraID OAuth */
  function loginEntraID(): void {
    const tenantId = import.meta.env.VITE_ENTRAID_TENANT_ID;
    const clientId = import.meta.env.VITE_ENTRAID_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_ENTRAID_REDIRECT_URI || `${window.location.origin}/auth/callback`;
    const scopes = import.meta.env.VITE_ENTRAID_SCOPES || 'openid profile email User.Read';

    const state = btoa(JSON.stringify({ provider: 'entraid' }));

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes,
      state,
    });
    window.location.href = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params}`;
  }

  /** Backward-compatible alias */
  function login(): void {
    loginForgeRock();
  }

  async function handleCallback(code: string, provider: AuthProvider = 'forgerock'): Promise<boolean> {
    try {
      const redirectUri = provider === 'entraid'
        ? (import.meta.env.VITE_ENTRAID_REDIRECT_URI || `${window.location.origin}/auth/callback`)
        : (import.meta.env.VITE_OIDC_REDIRECT_URI || `${window.location.origin}/auth/callback`);

      const response = await api.post<TokenResponse>('/api/auth/token', {
        code,
        redirect_uri: redirectUri,
        provider,
      });

      token.value = response.data.access_token;
      authProvider.value = provider;
      localStorage.setItem('token', token.value);
      localStorage.setItem('auth_provider', provider);
      await fetchUser();
      return true;
    } catch (error) {
      console.error('Auth callback error:', error);
      return false;
    }
  }

  async function fetchUser(): Promise<void> {
    if (!token.value) return;
    try {
      const response = await api.get<User>('/api/auth/me');
      user.value = response.data;
    } catch (error) {
      console.error('Fetch user error:', error);
      logout();
    }
  }

  function logout(): void {
    token.value = null;
    user.value = null;
    authProvider.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('auth_provider');
  }

  /**
   * Dev login bypass - for local testing when OAuth redirect isn't configured
   * Set VITE_DEV_BYPASS_AUTH=true in frontend .env
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function devLogin(_username = 'devuser'): Promise<boolean> {
    // Set a mock token (backend will validate via DEV_BYPASS_AUTH)
    token.value = 'dev-bypass-token';
    localStorage.setItem('token', token.value);
    await fetchUser();
    return true;
  }

  const isDevMode: boolean = import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

  // Initialize: fetch user if token exists
  if (token.value) {
    fetchUser();
  }

  return {
    user,
    token,
    authProvider,
    isAuthenticated,
    isAdmin,
    isDevMode,
    login,
    loginForgeRock,
    loginEntraID,
    devLogin,
    handleCallback,
    fetchUser,
    logout,
  };
});
