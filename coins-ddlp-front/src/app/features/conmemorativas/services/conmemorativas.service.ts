import { inject, Injectable } from '@angular/core';
import { from, map, Observable, switchMap } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';
import { OwnerService } from '../../../core/services/owner.service';
import { EuroCoin, RawEuroCoin } from '../../../shared/interfaces/euro-coin.interface';
import { TABLES } from '../../../shared/constants/collections.const';
import { ownerIdsOf, pickOwnership } from '../../../shared/helpers/ownership-map.helper';

const OWNERSHIP_JOIN = '*, euro_ownership!left(uds, conservation, observations, ownerId)';

@Injectable({ providedIn: 'root' })
export class ConmemorativasService {
  private supabase = inject(SupabaseService);
  private ownerService = inject(OwnerService);

  getAll(): Observable<EuroCoin[]> {
    return from(this.ownerService.ensureLoaded()).pipe(
      switchMap(() => {
        const primaryId = this.ownerService.primaryId();
        const compareId = this.ownerService.compareId();
        const ids = ownerIdsOf(primaryId, compareId);
        return this.supabase
          .getTableWhere<RawEuroCoin>(
            TABLES.euro,
            (query) => {
              const q = query
                .eq('commemorative', true)
                .order('description')
                .order('variant', { nullsFirst: true });
              return ids.length ? q.in('euro_ownership.ownerId', ids) : q;
            },
            OWNERSHIP_JOIN,
          )
          .pipe(map((coins) => coins.map((c) => this.mapRawCoin(c, primaryId, compareId))));
      }),
    );
  }

  private mapRawCoin(
    raw: RawEuroCoin,
    primaryId: string | null,
    compareId: string | null,
  ): EuroCoin {
    return {
      id: raw.id,
      year: raw.year,
      country: raw.country,
      mint: raw.mint,
      faceValue: raw.faceValue,
      description: raw.description,
      commemorative: raw.commemorative,
      circulation: raw.circulation,
      idNum: raw.idNum,
      variant: raw.variant,
      ...pickOwnership(raw.euro_ownership, primaryId, compareId),
    };
  }
}
