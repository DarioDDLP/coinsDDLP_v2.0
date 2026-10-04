import { LITERALS } from '../constants/literals';

/** Código ISO 3166-1 alfa-3 de un país con nombre en `LITERALS.countries`. */
export type CountryIso3 = keyof typeof LITERALS.countries;
