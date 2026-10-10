import { inject, Injectable } from '@angular/core';
import { from, map, Observable, switchMap } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';
import { OwnerService } from '../../../core/services/owner.service';
import { EuroStatsRow, RawEuroStatsRow } from '../../../shared/interfaces/euro-stats.interface';
import { TABLES } from '../../../shared/constants/collections.const';
import { ownerIdsOf, pickOwnership } from '../../../shared/helpers/ownership-map.helper';

const STATS_SELECT = 'country, year, faceValue, commemorative, euro_ownership!left(uds, ownerId)';

@Injectable({ providedIn: 'root' })
export class EstadisticasService {
  private supabase = inject(SupabaseService);
  private ownerService = inject(OwnerService);

  /** Catálogo de euros completo con las unidades de la colección activa (y de la comparada). */
  getEuroStats(): Observable<EuroStatsRow[]> {
    return from(this.ownerService.ensureLoaded()).pipe(
      switchMap(() => {
        const primaryId = this.ownerService.primaryId();
        const compareId = this.ownerService.compareId();
        const ids = ownerIdsOf(primaryId, compareId);
        return this.supabase
          .getTableWhere<RawEuroStatsRow>(
            TABLES.euro,
            (query) => (ids.length ? query.in('euro_ownership.ownerId', ids) : query),
            STATS_SELECT,
          )
          .pipe(map((rows) => rows.map((r) => this.mapRow(r, primaryId, compareId))));
      }),
    );
  }

  private mapRow(
    raw: RawEuroStatsRow,
    primaryId: string | null,
    compareId: string | null,
  ): EuroStatsRow {
    const { uds, udsAlt } = pickOwnership(raw.euro_ownership, primaryId, compareId);
    return {
      country: raw.country,
      year: raw.year,
      faceValue: raw.faceValue,
      commemorative: raw.commemorative,
      uds,
      ...(compareId ? { udsAlt } : {}),
    };
  }
}
