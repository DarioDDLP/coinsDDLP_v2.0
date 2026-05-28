import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';
import { LoadingService } from '../../../core/services/loading.service';
import { OwnerService, OWNER_IDS } from '../../../core/services/owner.service';
import {
  ConservationCode,
  EuroCoin,
  NewEuroCoin,
  RawEuroCoin,
  RawOwnership,
} from '../../../shared/interfaces/euro-coin.interface';
import { IEurosRepository } from '../../../shared/interfaces/euros-repository.interface';
import { TABLES } from '../../../shared/constants/collections.const';

const OWNERSHIP_JOIN = '*, euro_ownership!left(uds, conservation, observations, owner_id)';

@Injectable({ providedIn: 'root' })
export class EurosService implements IEurosRepository {
  private supabase = inject(SupabaseService);
  private loading = inject(LoadingService);
  private ownerService = inject(OwnerService);

  getAll(): Observable<Pick<EuroCoin, 'country' | 'year'>[]> {
    return this.supabase
      .getTableWhere<
        Pick<EuroCoin, 'country' | 'year'>
      >(TABLES.euro, (query) => query, 'country,year')
      .pipe(this.loading.withLoading());
  }

  getByCountry(country: string): Observable<Pick<EuroCoin, 'year' | 'commemorative'>[]> {
    return this.supabase
      .getTableWhere<
        Pick<EuroCoin, 'year' | 'commemorative'>
      >(TABLES.euro, (query) => query.eq('country', country), 'year,commemorative')
      .pipe(this.loading.withLoading());
  }

  getAllByCountry(country: string): Observable<EuroCoin[]> {
    const ownerId = this.ownerService.primaryId();
    return this.supabase
      .getTableWhere<RawEuroCoin>(
        TABLES.euro,
        (query) => this.applyOwnerFilter(query.eq('country', country), ownerId),
        OWNERSHIP_JOIN,
      )
      .pipe(
        map((coins) => coins.map((c) => this.mapRawCoin(c))),
        this.loading.withLoading(),
      );
  }

  getByCountryAndYear(country: string, year: number): Observable<EuroCoin[]> {
    const ownerId = this.ownerService.primaryId();
    return this.supabase
      .getTableWhere<RawEuroCoin>(
        TABLES.euro,
        (query) => this.applyOwnerFilter(query.eq('country', country).eq('year', year), ownerId),
        OWNERSHIP_JOIN,
      )
      .pipe(
        map((coins) => coins.map((c) => this.mapRawCoin(c))),
        this.loading.withLoading(),
      );
  }

  getById(id: string): Observable<EuroCoin | null> {
    const ownerId = this.ownerService.primaryId();
    return this.supabase
      .getTableWhere<RawEuroCoin>(
        TABLES.euro,
        (query) => this.applyOwnerFilter(query.eq('id', id), ownerId),
        OWNERSHIP_JOIN,
      )
      .pipe(
        map((coins) => (coins[0] ? this.mapRawCoin(coins[0]) : null)),
        this.loading.withLoading(),
      );
  }

  async create(coin: NewEuroCoin): Promise<string> {
    return this.supabase.add(TABLES.euro, coin);
  }

  async update(id: string, data: Partial<EuroCoin>, ownerId?: string): Promise<void> {
    const resolvedOwnerId = ownerId ?? this.ownerService.primaryId() ?? OWNER_IDS.dario;
    const { uds, conservation, observations, udsAlt, conservationAlt, ...catalogData } = data;

    const ownershipUpdate: Record<string, unknown> = {};
    if (uds !== undefined) ownershipUpdate['uds'] = uds;
    if (conservation !== undefined) ownershipUpdate['conservation'] = conservation;
    if (observations !== undefined) ownershipUpdate['observations'] = observations;

    const promises: Promise<void>[] = [];

    if (Object.keys(catalogData).length > 0) {
      promises.push(this.supabase.update(TABLES.euro, id, catalogData));
    }
    if (Object.keys(ownershipUpdate).length > 0) {
      promises.push(
        this.supabase.upsert(
          TABLES.euroOwnership,
          { euro_id: id, owner_id: resolvedOwnerId, ...ownershipUpdate },
          'euro_id,owner_id',
        ),
      );
    }

    await Promise.all(promises);
  }

  async remove(id: string): Promise<void> {
    return this.supabase.remove(TABLES.euro, id);
  }

  private applyOwnerFilter(query: any, ownerId: string | null): any {
    return ownerId ? query.eq('euro_ownership.owner_id', ownerId) : query;
  }

  private mapRawCoin(raw: RawEuroCoin): EuroCoin {
    const ownerships = raw.euro_ownership ?? [];
    const mode = this.ownerService.current();

    if (mode === 'ambas') {
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
