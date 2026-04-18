import { CONSERVATION_MAP } from '../constants/conservation-states.const';
import { LITERALS } from '../constants/literals';
import { Severity } from '../interfaces/severity.interface';

export interface BadgeData {
  label: string;
  severity: Severity;
  tooltip?: string;
}

export function getConservationBadge(code: string | undefined | null): BadgeData {
  const state = CONSERVATION_MAP.get(code ?? '') ?? CONSERVATION_MAP.get('ND')!;
  return { label: state.code, severity: state.severity, tooltip: state.name };
}

export function getUdsBadge(uds: number): BadgeData {
  const severity: Severity = uds === 0 ? 'danger' : uds === 1 ? 'success' : 'info';
  return { label: String(uds), severity };
}

export function getRoleBadge(role: string | null): BadgeData {
  return role === 'admin'
    ? { label: LITERALS.admin.roleAdmin, severity: 'warn' }
    : { label: LITERALS.admin.roleUser, severity: 'info' };
}
