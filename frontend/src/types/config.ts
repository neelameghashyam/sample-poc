export interface AppConfig {
  auth: {
    devBypass: boolean;
    oidc: {
      authorizationUri: string;
      clientId: string;
      redirectUri: string;
      scopes: string;
    };
    entraid: {
      tenantId: string;
      clientId: string;
      redirectUri: string;
      scopes: string;
    };
  };
  tinymce: {
    apiKey: string;
  };
  services: {
    docGenerateUrl: string;
  };
}
