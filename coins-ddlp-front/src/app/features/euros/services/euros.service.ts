import { inject, Injectable, signal } from '@angular/core';
import { map, Observable } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';
import { OwnerService, OWNER_IDS } from '../../../core/services/owner.service';
import {
  ConservationCode,
  EuroCoin,
  EuroCoinSummary,
  NewEuroCoin,
  RawEuroCoin,
  RawEuroCoinSummary,
  RawOwnership,
} from '../../../shared/interfaces/euro-coin.interface';
import { IEurosRepository } from '../../../shared/interfaces/euros-repository.interface';
import { TABLES } from '../../../shared/constants/collections.const';

const OWNERSHIP_JOIN = '*, euro_ownership!left(uds, conservation, observations, ownerId)';
const SUMMARY_SELECT = 'country, year, commemorative, euro_ownership!left(uds, ownerId)';

@Injectable({ providedIn: 'root' })
export class EurosService implements IEurosRepository {
  private supabase = inject(SupabaseService);
  private ownerService = inject(OwnerService);

  /** Se incrementa tras cada alta, edición o borrado para que las vistas abiertas recarguen. */
  readonly revision = signal(0);

  /**
   * Catálogo completo reducido a lo necesario para el progreso por país:
   * una fila por moneda con las unidades del propietario activo (o de ambos).
   */
  getCatalogSummary(): Observable<EuroCoinSummary[]> {
    const ownerId = this.ownerService.primaryId();
    return this.supabase
      .getTableWhere<RawEuroCoinSummary>(
        TABLES.euro,
        (query) => this.applyOwnerFilter(query, ownerId),
        SUMMARY_SELECT,
      )
      .pipe(map((rows) => rows.map((r) => this.mapSummary(r))));
  }

  getAll(): Observable<Pick<EuroCoin, 'country' | 'year'>[]> {
    return this.supabase.getTableWhere<Pick<EuroCoin, 'country' | 'year'>>(
      TABLES.euro,
      (query) => query,
      'country,year',
    );
  }

  getAllByCountry(country: string): Observable<EuroCoin[]> {
    const ownerId = this.ownerService.primaryId();
    return this.supabase
      .getTableWhere<RawEuroCoin>(
        TABLES.euro,
        (query) =>
          this.applyOwnerFilter(
            query
              .eq('country', country)
              .order('faceValue')
              .order('description')
              .order('variant', { nullsFirst: true }),
            ownerId,
          ),
        OWNERSHIP_JOIN,
      )
      .pipe(map((coins) => coins.map((c) => this.mapRawCoin(c))));
  }

  getByCountryAndYear(country: string, year: number): Observable<EuroCoin[]> {
    const ownerId = this.ownerService.primaryId();
    return this.supabase
      .getTableWhere<RawEuroCoin>(
        TABLES.euro,
        (query) =>
          this.applyOwnerFilter(
            query
              .eq('country', country)
              .eq('year', year)
              .order('faceValue')
              .order('description')
              .order('variant', { nullsFirst: true }),
            ownerId,
          ),
        OWNERSHIP_JOIN,
      )
      .pipe(map((coins) => coins.map((c) => this.mapRawCoin(c))));
  }

  getById(id: string): Observable<EuroCoin | null> {
    const ownerId = this.ownerService.primaryId();
    return this.supabase
      .getTableWhere<RawEuroCoin>(
        TABLES.euro,
        (query) => this.applyOwnerFilter(query.eq('id', id), ownerId),
        OWNERSHIP_JOIN,
      )
      .pipe(map((coins) => (coins[0] ? this.mapRawCoin(coins[0]) : null)));
  }

  async create(coin: NewEuroCoin): Promise<string> {
    const id = await this.supabase.add(TABLES.euro, coin);
    this.bumpRevision();
    return id;
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
          { euroId: id, ownerId: resolvedOwnerId, ...ownershipUpdate },
          'euroId,ownerId',
        ),
      );
    }

    await Promise.all(promises);
    this.bumpRevision();
  }

  async remove(id: string): Promise<void> {
    await this.supabase.remove(TABLES.euro, id);
    this.bumpRevision();
  }

  private bumpRevision(): void {
    this.revision.update((r) => r + 1);
  }

  private mapSummary(raw: RawEuroCoinSummary): EuroCoinSummary {
    const ownerships = raw.euro_ownership ?? [];
    if (this.ownerService.current() === 'both') {
      return {
        country: raw.country,
        year: raw.year,
        commemorative: raw.commemorative,
        uds: ownerships.find((o) => o.ownerId === OWNER_IDS.dario)?.uds ?? 0,
        udsAlt: ownerships.find((o) => o.ownerId === OWNER_IDS.manolo)?.uds ?? 0,
      };
    }
    return {
      country: raw.country,
      year: raw.year,
      commemorative: raw.commemorative,
      uds: ownerships[0]?.uds ?? 0,
    };
  }

  private applyOwnerFilter(query: any, ownerId: string | null): any {
    return ownerId ? query.eq('euro_ownership.ownerId', ownerId) : query;
  }

  private mapRawCoin(raw: RawEuroCoin): EuroCoin {
    const ownerships = raw.euro_ownership ?? [];
    const mode = this.ownerService.current();

    if (mode === 'both') {
      const dario = ownerships.find((o) => o.ownerId === OWNER_IDS.dario);
      const manolo = ownerships.find((o) => o.ownerId === OWNER_IDS.manolo);
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
      variant: raw.variant,
      uds: ownership?.uds ?? 0,
      conservation: (ownership?.conservation ?? 'ND') as ConservationCode,
      observations: ownership?.observations,
    };
  }
}
