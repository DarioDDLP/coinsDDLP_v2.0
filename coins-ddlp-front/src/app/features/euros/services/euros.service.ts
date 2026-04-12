import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';
import { EuroCoin } from '../../../shared/interfaces/euro-coin.interface';
import { IEurosRepository } from '../../../shared/interfaces/euros-repository.interface';
import { TABLES } from '../../../shared/constants/collections.const';

@Injectable({ providedIn: 'root' })
export class EurosService implements IEurosRepository {
  constructor(private supabase: SupabaseService) {}

  getAll(): Observable<Pick<EuroCoin, 'country' | 'year'>[]> {
    return this.supabase.getTableWhere<Pick<EuroCoin, 'country' | 'year'>>(
      TABLES.euro,
      (query) => query,
      'country,year'
    );
  }

  getByCountry(country: string): Observable<Pick<EuroCoin, 'year' | 'commemorative'>[]> {
    return this.supabase.getTableWhere<Pick<EuroCoin, 'year' | 'commemorative'>>(
      TABLES.euro,
      (query) => query.eq('country', country),
      'year,commemorative'
    );
  }

  getByCountryAndYear(country: string, year: number): Observable<EuroCoin[]> {
    return this.supabase.getTableWhere<EuroCoin>(
      TABLES.euro,
      (query) => query.eq('country', country).eq('year', year)
    );
  }

  getById(id: string): Observable<EuroCoin | null> {
    return new Observable(observer => {
      this.supabase.getTableWhere<EuroCoin>(
        TABLES.euro,
        (query) => query.eq('id', id)
      ).subscribe(coins => {
        observer.next(coins[0] ?? null);
        observer.complete();
      });
    });
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
