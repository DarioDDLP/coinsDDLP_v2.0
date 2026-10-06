import { COUNTRY_DB_NAMES } from '../constants/countries.const';

/** Código ISO 3166-1 alfa-3 de un país de `COUNTRY_DB_NAMES`. */
export type CountryIso3 = keyof typeof COUNTRY_DB_NAMES;
