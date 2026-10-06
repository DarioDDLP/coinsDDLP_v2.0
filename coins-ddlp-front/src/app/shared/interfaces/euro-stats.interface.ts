import { RawOwnership } from './euro-coin.interface';

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
  /** Solo en modo "ambas": unidades del segundo propietario. */
  udsAlt?: number;
}

/** Progreso de un grupo (país, valor facial, año). */
export interface StatGroup {
  key: string;
  label: string;
  owned: number;
  total: number;
}

export interface EuroStatsKpis {
  owned: number;
  total: number;
  commemorativeOwned: number;
  commemorativeTotal: number;
  /** Suma de unidades (de los dos propietarios en modo "ambas"). */
  units: number;
  /** Monedas con alguna unidad de sobra. */
  duplicateCoins: number;
  /** Unidades de sobra: Σ(uds − 1). */
  spareUnits: number;
  completedCountries: number;
  countries: number;
}
