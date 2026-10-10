import { inject, Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { SUPABASE_CLIENT } from '../../../app.config';
import {
  AccessEvent,
  AccessLogFilter,
  AccessLogStats,
  AccessVisit,
  AccessVisitPage,
  IAccessLogRepository,
} from '../../../shared/interfaces/access-log.interface';

/** Lectura del registro de accesos (la RLS solo deja al admin). Lo escribe la Edge Function `access-log`. */
@Injectable({ providedIn: 'root' })
export class AccessLogAdminService implements IAccessLogRepository {
  private supabase = inject(SUPABASE_CLIENT);
  private readonly pageSize = 1000;

  getPage(filter: AccessLogFilter, offset: number, limit: number): Observable<AccessVisitPage> {
    return from(
      this.supabase
        .rpc('access_visit_filtered', this.params(filter), { count: 'exact' })
        .order('startedAt', { ascending: false })
        .range(offset, offset + limit - 1)
        .then(({ data, count, error }) => {
          if (error) throw error;
          return { rows: (data ?? []) as AccessVisit[], total: count ?? 0 };
        }),
    );
  }

  /** Todas las visitas filtradas (para el Excel), de mil en mil. */
  getAll(filter: AccessLogFilter): Observable<AccessVisit[]> {
    const load = async () => {
      const all: AccessVisit[] = [];
      for (let offset = 0; ; offset += this.pageSize) {
        const { data, error } = await this.supabase
          .rpc('access_visit_filtered', this.params(filter))
          .order('startedAt', { ascending: false })
          .range(offset, offset + this.pageSize - 1);
        if (error) throw error;
        all.push(...((data ?? []) as AccessVisit[]));
        if (!data || data.length < this.pageSize) return all;
      }
    };
    return from(load());
  }

  getStats(filter: AccessLogFilter): Observable<AccessLogStats> {
    return from(
      this.supabase.rpc('access_log_stats', this.params(filter)).then(({ data, error }) => {
        if (error) throw error;
        return data as AccessLogStats;
      }),
    );
  }

  getEvents(visitId: string): Observable<AccessEvent[]> {
    return from(
      this.supabase
        .from('access_event')
        .select('*')
        .eq('visitId', visitId)
        .order('at', { ascending: true })
        .then(({ data, error }) => {
          if (error) throw error;
          return (data ?? []) as AccessEvent[];
        }),
    );
  }

  /** Vacía el registro (los eventos caen en cascada). PostgREST exige un filtro en los DELETE. */
  async clear(): Promise<void> {
    const { error } = await this.supabase.from('access_visit').delete().not('id', 'is', null);
    if (error) throw error;
  }

  private params(filter: AccessLogFilter) {
    return {
      p_from: filter.from,
      p_user: filter.user,
      p_exclude: filter.excludeUserId,
      p_search: filter.search.trim() || null,
    };
  }
}
