import { inject, Injectable, signal } from '@angular/core';
import { map, Observable } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Peseta } from '../../../shared/interfaces/peseta.interface';
import { TABLES } from '../../../shared/constants/collections.const';

@Injectable({ providedIn: 'root' })
export class PesetasService {
  private supabase = inject(SupabaseService);

  /** Se incrementa tras cada edición para que las vistas abiertas recarguen. */
  readonly revision = signal(0);

  getAll(): Observable<Peseta[]> {
    return this.supabase.getTableWhere<Peseta>(
      TABLES.peseta,
      (query) => query,
      '*, peseta_type(*)',
    );
  }

  async update(
    id: string,
    data: { uds: number; conservation: string | null; observations: string | null },
  ): Promise<void> {
    await this.supabase.update(TABLES.peseta, id, data);
    this.revision.update((r) => r + 1);
  }

  getById(id: string): Observable<Peseta | null> {
    return this.supabase
      .getTableWhere<Peseta>(TABLES.peseta, (query) => query.eq('id', id), '*, peseta_type(*)')
      .pipe(map((items) => items[0] ?? null));
  }
}
