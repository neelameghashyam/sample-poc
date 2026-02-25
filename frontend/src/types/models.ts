export type TGStatus = 'LED' | 'IEC' | 'LEC' | 'LES' | 'ADO' | 'STU' | 'DEL';

export type AuthProvider = 'forgerock' | 'entraid';

export interface User {
  id: number | null;
  username: string;
  name: string;
  email: string;
  country?: string;
  roles: string[];
  authProvider?: AuthProvider;
  isNewUser?: boolean;
  isDevMode?: boolean;
}

export interface DashboardStats {
  total: number;
  draft: number;
  ieComments: number;
  leChecking: number;
  adopted: number;
}

export interface TestGuidelineListItem {
  id: number;
  reference: string;
  name: string;
  status: TGStatus;
  lastUpdated: string;
  leadExpert: string | null;
}

export interface TestGuidelineDetail extends TestGuidelineListItem {
  language: string;
  leDraftStart: string | null;
  leDraftEnd: string | null;
  ieCommentsStart: string | null;
  ieCommentsEnd: string | null;
  leCheckingStart: string | null;
  leCheckingEnd: string | null;
  users: TgUser[];
}

export interface TgUser {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

export interface MenuItem {
  name: string;
  path: string;
  icon: string;
  adminOnly?: boolean;
}
