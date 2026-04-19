import { Observable } from 'rxjs';
import { EuroCoin } from './euro-coin.interface';

export interface IEurosRepository {
  getAll(): Observable<Pick<EuroCoin, 'country' | 'year'>[]>;
  getAllByCountry(country: string): Observable<EuroCoin[]>;
  getById(id: string): Observable<EuroCoin | null>;
  create(coin: Omit<EuroCoin, 'id'>): Promise<string>;
  update(id: string, data: Partial<EuroCoin>): Promise<void>;
  remove(id: string): Promise<void>;
}
