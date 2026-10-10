import { inject, Injectable, signal } from '@angular/core';
import { from, map, Observable, switchMap } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';
import { OwnerService } from '../../../core/services/owner.service';
import {
  EuroCoin,
  EuroCoinSummary,
  NewEuroCoin,
  RawEuroCoin,
  RawEuroCoinSummary,
} from '../../../shared/interfaces/euro-coin.interface';
import { IEurosRepository } from '../../../shared/interfaces/euros-repository.interface';
import { TABLES } from '../../../shared/constants/collections.const';
import { ownerIdsOf, pickOwnership } from '../../../shared/helpers/ownership-map.helper';

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
   * una fila por moneda con las unidades de la colección activa (y de la comparada).
   */
  getCatalogSummary(): Observable<EuroCoinSummary[]> {
    return this.withOwners((primaryId, compareId) =>
      this.supabase
        .getTableWhere<RawEuroCoinSummary>(
          TABLES.euro,
          (query) => this.applyOwnerFilter(query, primaryId, compareId),
          SUMMARY_SELECT,
        )
        .pipe(map((rows) => rows.map((r) => this.mapSummary(r, primaryId, compareId)))),
    );
  }

  getAll(): Observable<Pick<EuroCoin, 'country' | 'year'>[]> {
    return this.supabase.getTableWhere<Pick<EuroCoin, 'country' | 'year'>>(
      TABLES.euro,
      (query) => query,
      'country,year',
    );
  }

  getAllByCountry(country: string): Observable<EuroCoin[]> {
    return this.getCoins((query) =>
      query
        .eq('country', country)
        .order('faceValue')
        .order('description')
        .order('variant', { nullsFirst: true }),
    );
  }

  getByCountryAndYear(country: string, year: number): Observable<EuroCoin[]> {
    return this.getCoins((query) =>
      query
        .eq('country', country)
        .eq('year', year)
        .order('faceValue')
        .order('description')
        .order('variant', { nullsFirst: true }),
    );
  }

  getById(id: string): Observable<EuroCoin | null> {
    return this.getCoins((query) => query.eq('id', id)).pipe(map((coins) => coins[0] ?? null));
  }

  async create(coin: NewEuroCoin): Promise<string> {
    const id = await this.supabase.add(TABLES.euro, coin);
    this.bumpRevision();
    return id;
  }

  async update(id: string, data: Partial<EuroCoin>, ownerId: string | null): Promise<void> {
    const { uds, conservation, observations, udsAlt, conservationAlt, ...catalogData } = data;

    const ownershipUpdate: Record<string, unknown> = {};
    if (uds !== undefined) ownershipUpdate['uds'] = uds;
    if (conservation !== undefined) ownershipUpdate['conservation'] = conservation;
    if (observations !== undefined) ownershipUpdate['observations'] = observations;

    const promises: Promise<void>[] = [];

    if (Object.keys(catalogData).length > 0) {
      promises.push(this.supabase.update(TABLES.euro, id, catalogData));
    }
    if (ownerId && Object.keys(ownershipUpdate).length > 0) {
      promises.push(
        this.supabase.upsert(
          TABLES.euroOwnership,
          { euroId: id, ownerId, ...ownershipUpdate },
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

  /** Espera a que carguen las colecciones y lanza la consulta con las activas. */
  private withOwners<T>(
    fn: (primaryId: string | null, compareId: string | null) => Observable<T>,
  ): Observable<T> {
    return from(this.ownerService.ensureLoaded()).pipe(
      switchMap(() => fn(this.ownerService.primaryId(), this.ownerService.compareId())),
    );
  }

  private getCoins(filterFn: (query: any) => any): Observable<EuroCoin[]> {
    return this.withOwners((primaryId, compareId) =>
      this.supabase
        .getTableWhere<RawEuroCoin>(
          TABLES.euro,
          (query) => this.applyOwnerFilter(filterFn(query), primaryId, compareId),
          OWNERSHIP_JOIN,
        )
        .pipe(map((coins) => coins.map((c) => this.mapRawCoin(c, primaryId, compareId)))),
    );
  }

  private mapSummary(
    raw: RawEuroCoinSummary,
    primaryId: string | null,
    compareId: string | null,
  ): EuroCoinSummary {
    const { uds, udsAlt } = pickOwnership(raw.euro_ownership, primaryId, compareId);
    return {
      country: raw.country,
      year: raw.year,
      commemorative: raw.commemorative,
      uds,
      ...(compareId ? { udsAlt } : {}),
    };
  }

  /** Solo trae la posesión de las colecciones que se ven (no la de todos los usuarios). */
  private applyOwnerFilter(query: any, primaryId: string | null, compareId: string | null): any {
    const ids = ownerIdsOf(primaryId, compareId);
    return ids.length ? query.in('euro_ownership.ownerId', ids) : query;
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
