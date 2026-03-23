export type TGStatus = 'CRT' | 'LED' | 'IEC' | 'LEC' | 'LES' | 'TCD' | 'UOC' | 'TRN' | 'STU' | 'ADT' | 'ARC' | 'ABT' | 'SSD';

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
  twpDrafts: number;
  tcDrafts?: number;
  archived: number;
  pendingRequests?: number;
  twpCounts?: {
    twpDrafts: Record<string, number>;
    tcDrafts?: Record<string, number>;
    archived: Record<string, number>;
  };
}

export interface TestGuidelineListItem {
  id: number;
  reference: string;
  name: string;
  status: TGStatus;
  lastUpdated: string;
  adoptionDate: string | null;
  statusDate: string | null;
  leadExpert: string | null;
  leadExpertCountry: string | null;
  upovCodes: string[];
  twps: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  ieCommentCount?: number;
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

export interface IeComment {
  id: number;
  chapterName: string | null;
  sectionName: string | null;
  comments: string;
  lastUpdated: string;
  ieName: string;
  ieCountry: string | null;
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

export interface TechnicalBody {
  id: number;
  code: string;
  description: string | null;
  year: number;
  session: string | null;
  location: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  leDraftStart: string | null;
  leDraftEnd: string | null;
  ieCommentsStart: string | null;
  ieCommentsEnd: string | null;
  leCheckingStart: string | null;
  leCheckingEnd: string | null;
  sentToUpov: string | null;
  translationStart: string | null;
  translationEnd: string | null;
  adoptionDate: string | null;
}

export interface TechnicalBodyOption {
  code: string;
  description: string;
}

export interface MenuItem {
  name: string;
  path: string;
  icon: string;
  adminOnly?: boolean;
}
