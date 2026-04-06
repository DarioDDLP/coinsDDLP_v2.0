export type ConservationCode = 'FDC' | 'SC' | 'EBC' | 'MBC' | 'BC' | 'RC' | 'MC' | 'ND';

export interface EuroCoin {
  id: string;
  year: number;
  country: string;
  mint?: string;
  faceValue: string;
  description: string;
  uds: number;
  conservation: ConservationCode;
  commemorative: boolean;
  circulation: boolean;
  idNum: string;
  observations?: string;
}
