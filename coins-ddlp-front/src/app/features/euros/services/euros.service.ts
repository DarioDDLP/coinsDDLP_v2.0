import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';
import { LoadingService } from '../../../core/services/loading.service';
import { EuroCoin } from '../../../shared/interfaces/euro-coin.interface';
import { IEurosRepository } from '../../../shared/interfaces/euros-repository.interface';
import { TABLES } from '../../../shared/constants/collections.const';

@Injectable({ providedIn: 'root' })
export class EurosService implements IEurosRepository {
  private supabase = inject(SupabaseService);
  private loading = inject(LoadingService);

  getAll(): Observable<Pick<EuroCoin, 'country' | 'year'>[]> {
    return this.supabase.getTableWhere<Pick<EuroCoin, 'country' | 'year'>>(
      TABLES.euro,
      (query) => query,
      'country,year'
    ).pipe(this.loading.withLoading());
  }

  getByCountry(country: string): Observable<Pick<EuroCoin, 'year' | 'commemorative'>[]> {
    return this.supabase.getTableWhere<Pick<EuroCoin, 'year' | 'commemorative'>>(
      TABLES.euro,
      (query) => query.eq('country', country),
      'year,commemorative'
    ).pipe(this.loading.withLoading());
  }

  getAllByCountry(country: string): Observable<EuroCoin[]> {
    return this.supabase.getTableWhere<EuroCoin>(
      TABLES.euro,
      (query) => query.eq('country', country)
    ).pipe(this.loading.withLoading());
  }

  getByCountryAndYear(country: string, year: number): Observable<EuroCoin[]> {
    return this.supabase.getTableWhere<EuroCoin>(
      TABLES.euro,
      (query) => query.eq('country', country).eq('year', year)
    ).pipe(this.loading.withLoading());
  }

  getById(id: string): Observable<EuroCoin | null> {
    return this.supabase.getTableWhere<EuroCoin>(
      TABLES.euro,
      (query) => query.eq('id', id)
    ).pipe(
      map(coins => coins[0] ?? null),
      this.loading.withLoading()
    );
  }

  async create(coin: Omit<EuroCoin, 'id'>): Promise<string> {
    return this.supabase.add(TABLES.euro, coin);
  }

  async update(id: string, data: Partial<EuroCoin>): Promise<void> {
    return this.supabase.update(TABLES.euro, id, data);
  }

  async remove(id: string): Promise<void> {
    return this.supabase.remove(TABLES.euro, id);
  }
}
