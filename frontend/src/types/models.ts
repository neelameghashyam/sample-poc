export type TGStatus = 'LED' | 'IEC' | 'LEC' | 'LES' | 'ADT' | 'ABT' | 'SSD' | 'ARC' | 'STU' | 'DEL';

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
  statusCode?: string;
  requestStatus?: string;
  officeCode?: string;
  twps?: string;
  needsAccessRequest?: boolean;
  isPending?: boolean;
}

export interface PendingUser {
  id: number;
  userName: string;
  fullName: string;
  email: string;
  officeCode: string;
  officeName: string | null;
  twps: string;
  requestStatus: string;
}

export interface DashboardStats {
  total: number;
  draft: number;
  ieComments: number;
  leChecking: number;
  active: number;
  adopted: number;
  archive: number;
}

export interface TestGuidelineListItem {
  id: number;
  reference: string;
  name: string;
  status: TGStatus;
  lastUpdated: string;
  leadExpert: string | null;
  leadExpertCountry: string | null;
  upovCodes: string[];
  twps: string | null;
  periodStart: string | null;
  periodEnd: string | null;
}

export interface TestGuidelineDetail extends TestGuidelineListItem {
  language: string;
  leDraftStart: string | null;
  leDraftEnd: string | null;
  ieCommentsStart: string | null;
  ieCommentsEnd: string | null;
  leCheckingStart: string | null;
  leCheckingEnd: string | null;
  adminComments: string | null;
  ieCommentCount: number;
  users: TgUser[];
}

export interface TgUser {
  id: number;
  fullName: string;
  email: string;
  role: string;
  country?: string;
}

export interface AdminUser {
  id: number;
  userName: string;
  fullName: string;
  email: string;
  roleCode: string;
  statusCode: string;
  requestStatus: string;
  officeCode: string;
  officeName: string | null;
  twps: string | null;
  lastUpdated: string;
  leTgNames: string | null;
}

export interface MenuItem {
  name: string;
  path: string;
  icon: string;
  adminOnly?: boolean;
}
