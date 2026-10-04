import { LITERALS } from '../constants/literals';
import { CountryIso3 } from '../interfaces/country.interface';
import { normalizeString } from './normalize-strings.helper';

/** Índice inverso nombre normalizado → ISO3 ("españa" → "ESP"). */
const ISO3_BY_NAME = new Map<string, CountryIso3>(
  (Object.entries(LITERALS.countries) as [CountryIso3, string][]).map(([iso3, name]) => [
    normalizeString(name),
    iso3,
  ]),
);

/** Código ISO3 de un país por su nombre (sin distinguir acentos ni mayúsculas); `null` si no está en `LITERALS.countries`. */
export function getCountryIso3(country: string): CountryIso3 | null {
  return ISO3_BY_NAME.get(normalizeString(country)) ?? null;
}

/** Ruta de la bandera de un país (`assets/flags/esp.png`); `null` si el país no tiene código. */
export function getFlagPath(country: string): string | null {
  const iso3 = getCountryIso3(country);
  return iso3 ? `assets/flags/${iso3.toLowerCase()}.png` : null;
}
