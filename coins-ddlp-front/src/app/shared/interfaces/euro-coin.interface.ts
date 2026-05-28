export type ConservationCode = 'FDC' | 'SC' | 'EBC' | 'MBC' | 'BC' | 'RC' | 'MC' | 'ND';

export interface RawOwnership {
  uds: number;
  conservation: string;
  observations?: string;
  owner_id: string;
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
  // Ownership fields (from euro_ownership join)
  uds: number;
  conservation: ConservationCode;
  observations?: string;
  // Ambas mode: second owner's data
  udsAlt?: number;
  conservationAlt?: ConservationCode;
  observationsAlt?: string;
}

export type NewEuroCoin = Omit<
  EuroCoin,
  'id' | 'uds' | 'conservation' | 'observations' | 'udsAlt' | 'conservationAlt' | 'observationsAlt'
>;
