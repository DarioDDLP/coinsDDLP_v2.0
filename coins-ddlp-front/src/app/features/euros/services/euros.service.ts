import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FirestoreService } from '../../../core/services/firestore.service';
import { EuroCoin } from '../../../shared/interfaces/euro-coin.interface';
import { IEurosRepository } from '../../../shared/interfaces/euros-repository.interface';
import { COLLECTIONS } from '../../../shared/constants/collections.const';

@Injectable({ providedIn: 'root' })
export class EurosService implements IEurosRepository {
  constructor(private firestore: FirestoreService) {}

  getAll(): Observable<EuroCoin[]> {
    return this.firestore.getCollection<EuroCoin>(COLLECTIONS.euros);
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
    return this.firestore.add(COLLECTIONS.euros, coin);
  }

  async update(id: string, data: Partial<EuroCoin>): Promise<void> {
    return this.firestore.update(COLLECTIONS.euros, id, data);
  }

  async remove(id: string): Promise<void> {
    return this.firestore.remove(COLLECTIONS.euros, id);
  }
}
