import { CONSERVATION_MAP } from '../constants/conservation-states.const';
import { Translations } from '../interfaces/translations.interface';
import { Severity } from '../interfaces/severity.interface';

export interface BadgeData {
  label: string;
  severity: Severity;
  tooltip?: string;
}

export function getConservationBadge(code: string | undefined | null): BadgeData | null {
  if (!code || code === 'ND') return null;
  const state = CONSERVATION_MAP.get(code);
  if (!state) return null;
  return { label: state.code, severity: state.severity, tooltip: state.name };
}

export function getUdsBadge(uds: number): BadgeData {
  const severity: Severity = uds === 0 ? 'danger' : uds === 1 ? 'success' : 'info';
  return { label: String(uds), severity };
}

export function getRoleBadge(role: string | null, t: Translations['admin']): BadgeData {
  return role === 'admin'
    ? { label: t.roleAdmin, severity: 'warn' }
    : { label: t.roleUser, severity: 'info' };
}
