import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';
import { LoadingService } from '../../../core/services/loading.service';
import { EuroCoin } from '../../../shared/interfaces/euro-coin.interface';
import { TABLES } from '../../../shared/constants/collections.const';

@Injectable({ providedIn: 'root' })
export class ConmemorativasService {
  private supabase = inject(SupabaseService);
  private loading  = inject(LoadingService);

  getAll(): Observable<EuroCoin[]> {
    return this.supabase.getTableWhere<EuroCoin>(
      TABLES.euro,
      (query) => query.eq('commemorative', true)
    ).pipe(this.loading.withLoading());
  }
}
