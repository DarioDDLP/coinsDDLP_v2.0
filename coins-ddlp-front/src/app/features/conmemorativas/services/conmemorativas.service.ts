import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';
import { LoadingService } from '../../../core/services/loading.service';
import { OwnerService, OWNER_IDS } from '../../../core/services/owner.service';
import {
  ConservationCode,
  EuroCoin,
  RawEuroCoin,
} from '../../../shared/interfaces/euro-coin.interface';
import { TABLES } from '../../../shared/constants/collections.const';

const OWNERSHIP_JOIN = '*, euro_ownership!left(uds, conservation, observations, owner_id)';

@Injectable({ providedIn: 'root' })
export class ConmemorativasService {
  private supabase = inject(SupabaseService);
  private loading = inject(LoadingService);
  private ownerService = inject(OwnerService);

  getAll(): Observable<EuroCoin[]> {
    const ownerId = this.ownerService.primaryId();
    return this.supabase
      .getTableWhere<RawEuroCoin>(
        TABLES.euro,
        (query) => {
          const q = query.eq('commemorative', true);
          return ownerId ? q.eq('euro_ownership.owner_id', ownerId) : q;
        },
        OWNERSHIP_JOIN,
      )
      .pipe(
        map((coins) => coins.map((c) => this.mapRawCoin(c))),
        this.loading.withLoading(),
      );
  }

  private mapRawCoin(raw: RawEuroCoin): EuroCoin {
    const ownerships = raw.euro_ownership ?? [];
    const mode = this.ownerService.current();

    if (mode === 'both') {
      const dario = ownerships.find((o) => o.owner_id === OWNER_IDS.dario);
      const manolo = ownerships.find((o) => o.owner_id === OWNER_IDS.manolo);
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
        uds: dario?.uds ?? 0,
        conservation: (dario?.conservation ?? 'ND') as ConservationCode,
        observations: dario?.observations,
        udsAlt: manolo?.uds ?? 0,
        conservationAlt: (manolo?.conservation ?? 'ND') as ConservationCode,
        observationsAlt: manolo?.observations,
      };
    }

    const ownership = ownerships[0];
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
      uds: ownership?.uds ?? 0,
      conservation: (ownership?.conservation ?? 'ND') as ConservationCode,
      observations: ownership?.observations,
    };
  }
}
