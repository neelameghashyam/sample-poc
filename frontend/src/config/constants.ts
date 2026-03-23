import type { TGStatus } from '@/types';

/**
 * Application-level constants and reference data.
 * Static mappings that rarely change — no need for API calls.
 */

/** Date display format used across the app. */
export const DATE_FORMAT = 'dd/MM/yyyy';

/** TG status code → human-readable label. Source: Status_TG table. */
export const STATUS_LABELS: Record<TGStatus, string> = {
  CRT: 'Created',
  LED: 'LE Draft',
  IEC: 'IE Comments',
  LEC: 'LE Checking',
  LES: 'LE Signed Off',
  TWD: 'TWP Discussion Draft',
  TCD: 'TC-EDC/TC Draft',
  TDD: 'TC-EDC/TC Discussion Draft',
  UOC: 'UPOV Office Comments',
  TRN: 'TG in Translation',
  STU: 'Sent to UPOV',
  ADT: 'Adopted',
  ARC: 'Archived',
  ABT: 'Adopted before TGP/7',
  SSD: 'Superseded',
};

/** TG status code → StatusBadge variant for UI styling. */
export const STATUS_VARIANTS: Record<TGStatus, string> = {
  CRT: 'neutral',
  LED: 'warning',
  IEC: 'info',
  LEC: 'success',
  LES: 'info',
  TWD: 'warning',
  TCD: 'warning',
  TDD: 'warning',
  UOC: 'info',
  TRN: 'info',
  STU: 'warning',
  ADT: 'success',
  ARC: 'neutral',
  ABT: 'neutral',
  SSD: 'neutral',
};

/** Statuses shown in the TWP Drafts status filter. */
export const TWP_DRAFT_STATUSES = [
  { value: 'LED', label: STATUS_LABELS.LED },
  { value: 'IEC', label: STATUS_LABELS.IEC },
  { value: 'LEC', label: STATUS_LABELS.LEC },
  { value: 'LES', label: STATUS_LABELS.LES },
  { value: 'TWD', label: STATUS_LABELS.TWD },
  { value: 'STU', label: STATUS_LABELS.STU },
] as const;

/** Statuses shown in the TC/TC-EDC Drafts status filter. */
export const TC_DRAFT_STATUSES = [
  { value: 'TCD', label: STATUS_LABELS.TCD },
  { value: 'TDD', label: STATUS_LABELS.TDD },
  { value: 'STU', label: STATUS_LABELS.STU },
] as const;

/** Technical body codes that have no deadline fields. */
export const NO_DEADLINE_BODIES = ['TC', 'TC-EDC'] as const;
