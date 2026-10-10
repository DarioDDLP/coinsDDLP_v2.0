import { RawOwnership } from './euro-coin.interface';
import { OwnedCount } from './owned-count.interface';

export interface RawEuroStatsRow {
  country: string;
  year: number;
  faceValue: string;
  commemorative: boolean;
  euro_ownership: Pick<RawOwnership, 'uds' | 'ownerId'>[] | null;
}

/** Fila mínima del catálogo para las estadísticas, con las unidades del propietario activo. */
export interface EuroStatsRow {
  country: string;
  year: number;
  faceValue: string;
  commemorative: boolean;
  uds: number;
  /** Solo al comparar: unidades de la segunda colección. */
  udsAlt?: number;
}

/** Progreso de un grupo (país, valor facial, año). */
export interface StatGroup extends OwnedCount {
  key: string;
  label: string;
}

/** `owned` cuenta, al comparar, las que tiene alguna de las dos colecciones. */
export interface EuroStatsKpis extends OwnedCount {
  commemorativeOwned: number;
  commemorativeTotal: number;
  /** Suma de unidades (de las dos colecciones al comparar). */
  units: number;
  /** Monedas con alguna unidad de sobra. */
  duplicateCoins: number;
  /** Unidades de sobra: Σ(uds − 1). */
  spareUnits: number;
  completedCountries: number;
  countries: number;
}
