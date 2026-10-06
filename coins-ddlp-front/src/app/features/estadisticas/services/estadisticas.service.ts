import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';
import { OwnerService, OWNER_IDS } from '../../../core/services/owner.service';
import { EuroStatsRow, RawEuroStatsRow } from '../../../shared/interfaces/euro-stats.interface';
import { TABLES } from '../../../shared/constants/collections.const';

const STATS_SELECT = 'country, year, faceValue, commemorative, euro_ownership!left(uds, ownerId)';

@Injectable({ providedIn: 'root' })
export class EstadisticasService {
  private supabase = inject(SupabaseService);
  private ownerService = inject(OwnerService);

  /** Catálogo de euros completo con las unidades del propietario activo (o de ambos). */
  getEuroStats(): Observable<EuroStatsRow[]> {
    const ownerId = this.ownerService.primaryId();
    const both = this.ownerService.current() === 'both';
    return this.supabase
      .getTableWhere<RawEuroStatsRow>(
        TABLES.euro,
        (query) => (ownerId ? query.eq('euro_ownership.ownerId', ownerId) : query),
        STATS_SELECT,
      )
      .pipe(map((rows) => rows.map((r) => this.mapRow(r, both))));
  }

  private mapRow(raw: RawEuroStatsRow, both: boolean): EuroStatsRow {
    const ownerships = raw.euro_ownership ?? [];
    const row: EuroStatsRow = {
      country: raw.country,
      year: raw.year,
      faceValue: raw.faceValue,
      commemorative: raw.commemorative,
      uds: 0,
    };
    if (both) {
      row.uds = ownerships.find((o) => o.ownerId === OWNER_IDS.dario)?.uds ?? 0;
      row.udsAlt = ownerships.find((o) => o.ownerId === OWNER_IDS.manolo)?.uds ?? 0;
    } else {
      row.uds = ownerships[0]?.uds ?? 0;
    }
    return row;
  }
}
