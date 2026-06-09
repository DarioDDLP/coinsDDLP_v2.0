export interface CountryLocation {
  id: string;
  country: string;
  album: number;
  yearFrom: number;
  yearTo: number | null;
  isClosed: boolean;
}

export type NewCountryLocation = Omit<CountryLocation, 'id'>;
