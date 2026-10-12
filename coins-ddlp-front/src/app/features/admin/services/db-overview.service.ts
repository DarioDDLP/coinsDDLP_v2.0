import { inject, Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { SUPABASE_CLIENT } from '../../../app.config';
import {
  DbTableCounts,
  DbTableName,
  IDbOverviewRepository,
} from '../../../shared/interfaces/db-schema.interface';

/** Datos en vivo de Admin → Base de datos (la estructura es fija, en `db-schema.config.ts`). */
@Injectable({ providedIn: 'root' })
export class DbOverviewService implements IDbOverviewRepository {
  private supabase = inject(SUPABASE_CLIENT);

  /** Filas de cada tabla con `db_table_counts()` (solo admin; incluye `auth.users`). */
  getTableCounts(): Observable<DbTableCounts> {
    return from(
      this.supabase.rpc('db_table_counts').then(({ data, error }) => {
        if (error) throw error;
        const counts: DbTableCounts = {};
        for (const { name, rows } of (data ?? []) as { name: DbTableName; rows: number }[]) {
          counts[name] = Number(rows);
        }
        return counts;
      }),
    );
  }
}
