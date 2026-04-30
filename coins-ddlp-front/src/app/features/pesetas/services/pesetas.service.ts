import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';
import { LoadingService } from '../../../core/services/loading.service';
import { Peseta } from '../../../shared/interfaces/peseta.interface';
import { TABLES } from '../../../shared/constants/collections.const';

@Injectable({ providedIn: 'root' })
export class PesetasService {
  private supabase = inject(SupabaseService);
  private loading  = inject(LoadingService);

  getAll(): Observable<Peseta[]> {
    return this.supabase.getTableWhere<Peseta>(
      TABLES.peseta,
      (query) => query,
      '*, peseta_type(*)'
    ).pipe(this.loading.withLoading());
  }

  getById(id: string): Observable<Peseta | null> {
    return this.supabase.getTableWhere<Peseta>(
      TABLES.peseta,
      (query) => query.eq('id', id),
      '*, peseta_type(*)'
    ).pipe(
      map(items => items[0] ?? null),
      this.loading.withLoading()
    );
  }
}
