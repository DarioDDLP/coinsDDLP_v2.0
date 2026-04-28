import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
}
