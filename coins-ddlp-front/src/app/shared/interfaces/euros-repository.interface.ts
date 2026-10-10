import { Observable } from 'rxjs';
import { EuroCoin, EuroCoinSummary, NewEuroCoin } from './euro-coin.interface';

export interface IEurosRepository {
  getCatalogSummary(): Observable<EuroCoinSummary[]>;
  getAll(): Observable<Pick<EuroCoin, 'country' | 'year'>[]>;
  getAllByCountry(country: string): Observable<EuroCoin[]>;
  getById(id: string): Observable<EuroCoin | null>;
  create(coin: NewEuroCoin): Promise<string>;
  /** `ownerId`: colección donde se guardan unidades, conservación y observaciones. */
  update(id: string, data: Partial<EuroCoin>, ownerId: string | null): Promise<void>;
  remove(id: string): Promise<void>;
}
