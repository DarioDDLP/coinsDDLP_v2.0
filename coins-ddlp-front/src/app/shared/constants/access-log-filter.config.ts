import { FilterPillOption } from '../components/filter-pills/filter-pills.component';
import { Translations } from '../interfaces/translations.interface';

export type AccessLogPeriod = 'today' | '7d' | '30d' | '90d';

/** Días hacia atrás de cada periodo ("Hoy" empieza a medianoche). */
export const ACCESS_LOG_PERIOD_DAYS: Record<AccessLogPeriod, number> = {
  today: 0,
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

export function getAccessLogPeriodOptions(t: Translations['admin']['accessLog']): FilterPillOption[] {
  return [
    { value: 'today', label: t.periodToday },
    { value: '7d', label: t.period7 },
    { value: '30d', label: t.period30 },
    { value: '90d', label: t.period90 },
  ];
}
