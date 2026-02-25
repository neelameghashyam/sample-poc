/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_OIDC_AUTHORIZATION_URI: string;
  readonly VITE_OIDC_CLIENT_ID: string;
  readonly VITE_OIDC_REDIRECT_URI: string;
  readonly VITE_OIDC_SCOPES: string;
  readonly VITE_DEV_BYPASS_AUTH: string;
  readonly VITE_ENTRAID_TENANT_ID: string;
  readonly VITE_ENTRAID_CLIENT_ID: string;
  readonly VITE_ENTRAID_REDIRECT_URI: string;
  readonly VITE_ENTRAID_SCOPES: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
