import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';
import { EuroCoin } from '../../../shared/interfaces/euro-coin.interface';
import { IEurosRepository } from '../../../shared/interfaces/euros-repository.interface';
import { TABLES } from '../../../shared/constants/collections.const';

@Injectable({ providedIn: 'root' })
export class EurosService implements IEurosRepository {
  constructor(private supabase: SupabaseService) {}

  getAll(): Observable<EuroCoin[]> {
    return this.supabase.getTable<EuroCoin>(TABLES.euro);
  }

  getById(id: string): Observable<EuroCoin | null> {
    return new Observable(observer => {
      this.getAll().subscribe(coins => {
        const coin = coins.find(c => c.id === id) || null;
        observer.next(coin);
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
