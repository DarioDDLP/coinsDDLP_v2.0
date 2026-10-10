import { AccessDeviceType, AccessEventType } from '../interfaces/access-log.interface';
import { AccessLogPeriod, ACCESS_LOG_PERIOD_DAYS } from '../constants/access-log-filter.config';

/** Duración legible: "45 s", "3 min 20 s", "1 h 05 min" (símbolos del SI: iguales en ES y EN). */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s} s`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h} h ${String(m).padStart(2, '0')} min`;
  const rest = s % 60;
  return rest ? `${m} min ${rest} s` : `${m} min`;
}

/** Inicio del periodo en ISO: "Hoy" desde medianoche (hora local); el resto, N días atrás. */
export function getPeriodStart(period: AccessLogPeriod, now = new Date()): string {
  const start = new Date(now);
  const days = ACCESS_LOG_PERIOD_DAYS[period];
  if (days === 0) start.setHours(0, 0, 0, 0);
  else start.setDate(start.getDate() - days);
  return start.toISOString();
}

const DEVICE_ICONS: Record<AccessDeviceType, string> = {
  desktop: 'pi pi-desktop',
  tablet: 'pi pi-tablet',
  mobile: 'pi pi-mobile',
  bot: 'pi pi-server',
};

export function getDeviceIcon(type: AccessDeviceType | null): string {
  return type ? DEVICE_ICONS[type] : 'pi pi-question-circle';
}

const EVENT_ICONS: Record<AccessEventType, string> = {
  page: 'pi pi-file',
  login: 'pi pi-sign-in',
  logout: 'pi pi-sign-out',
  login_failed: 'pi pi-ban',
};

export function getEventIcon(type: AccessEventType): string {
  return EVENT_ICONS[type];
}

/** "Madrid, Comunidad de Madrid, España" sin huecos; null si no hay ubicación. */
export function formatLocation(v: {
  city: string | null;
  region: string | null;
  country: string | null;
}): string | null {
  const parts = [v.city, v.region, v.country].filter((p): p is string => !!p);
  // La región suele repetir la ciudad (Madrid, Madrid): se quita el duplicado
  return parts.length ? [...new Set(parts)].join(', ') : null;
}
