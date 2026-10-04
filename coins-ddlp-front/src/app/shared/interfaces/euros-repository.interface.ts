import { Observable } from 'rxjs';
import { EuroCoin, EuroCoinSummary, NewEuroCoin } from './euro-coin.interface';

export interface IEurosRepository {
  getCatalogSummary(): Observable<EuroCoinSummary[]>;
  getAll(): Observable<Pick<EuroCoin, 'country' | 'year'>[]>;
  getAllByCountry(country: string): Observable<EuroCoin[]>;
  getById(id: string): Observable<EuroCoin | null>;
  create(coin: NewEuroCoin): Promise<string>;
  update(id: string, data: Partial<EuroCoin>, ownerId?: string): Promise<void>;
  remove(id: string): Promise<void>;
}
