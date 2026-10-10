import { Observable } from 'rxjs';

export type AccessDeviceType = 'desktop' | 'tablet' | 'mobile' | 'bot';
export type AccessEventType = 'page' | 'login' | 'logout' | 'login_failed';

/** Una visita = una pestaña abierta (fila de `access_visit_summary`). */
export interface AccessVisit {
  id: string;
  startedAt: string;
  lastSeenAt: string;
  userId: string | null;
  userName: string | null;
  ip: string | null;
  country: string | null;
  countryCode: string | null;
  region: string | null;
  city: string | null;
  userAgent: string | null;
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  deviceType: AccessDeviceType | null;
  screen: string | null;
  language: string | null;
  appLang: string | null;
  referrer: string | null;
  landingPath: string | null;
  appVersion: string | null;
  pageCount: number;
  durationSeconds: number;
}

export interface AccessEvent {
  id: number;
  visitId: string;
  at: string;
  type: AccessEventType;
  path: string | null;
  userId: string | null;
  detail: string | null;
}

/** `user`: null = todos · 'anon' = sin sesión · 'users' = con sesión · uid de un usuario. */
export interface AccessLogFilter {
  from: string | null;
  user: string | null;
  excludeUserId: string | null;
  search: string;
}

export interface AccessLogStats {
  visits: number;
  visitors: number;
  users: number;
  logins: number;
  failedLogins: number;
}

export interface AccessVisitPage {
  rows: AccessVisit[];
  total: number;
}

export interface IAccessLogRepository {
  getPage(filter: AccessLogFilter, offset: number, limit: number): Observable<AccessVisitPage>;
  getAll(filter: AccessLogFilter): Observable<AccessVisit[]>;
  getStats(filter: AccessLogFilter): Observable<AccessLogStats>;
  getEvents(visitId: string): Observable<AccessEvent[]>;
  clear(): Promise<void>;
}
