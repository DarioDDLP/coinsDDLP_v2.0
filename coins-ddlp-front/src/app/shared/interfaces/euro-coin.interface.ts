export type ConservationCode = 'FDC' | 'SC' | 'EBC' | 'MBC' | 'BC' | 'RC' | 'MC' | 'ND';

export interface RawOwnership {
  uds: number;
  conservation: string;
  observations?: string;
  ownerId: string;
}

export interface RawEuroCoin {
  id: string;
  year: number;
  country: string;
  mint?: string;
  faceValue: string;
  description: string;
  commemorative: boolean;
  circulation: boolean;
  idNum: string;
  variant?: string;
  euro_ownership: RawOwnership[] | null;
}

export interface EuroCoin {
  id: string;
  year: number;
  country: string;
  mint?: string;
  faceValue: string;
  description: string;
  commemorative: boolean;
  circulation: boolean;
  idNum: string;
  variant?: string;
  // Ownership fields (from euro_ownership join)
  uds: number;
  conservation: ConservationCode;
  observations?: string;
  // Ambas mode: second owner's data
  udsAlt?: number;
  conservationAlt?: ConservationCode;
  observationsAlt?: string;
}

export interface RawEuroCoinSummary {
  country: string;
  year: number;
  commemorative: boolean;
  euro_ownership: Pick<RawOwnership, 'uds' | 'ownerId'>[] | null;
}

/** Fila mínima del catálogo para calcular progreso por país y año. */
export interface EuroCoinSummary {
  country: string;
  year: number;
  commemorative: boolean;
  uds: number;
  /** Solo en modo "ambas": unidades del segundo propietario. */
  udsAlt?: number;
}

export type NewEuroCoin = Omit<
  EuroCoin,
  'id' | 'uds' | 'conservation' | 'observations' | 'udsAlt' | 'conservationAlt' | 'observationsAlt'
>;
