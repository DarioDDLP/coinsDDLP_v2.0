import { COUNTRY_DB_NAMES } from '../constants/countries.const';
import { Translations } from '../interfaces/translations.interface';
import { CountryIso3 } from '../interfaces/country.interface';
import { normalizeString } from './normalize-strings.helper';

/** Índice inverso nombre normalizado → ISO3 ("españa" → "ESP"). */
const ISO3_BY_NAME = new Map<string, CountryIso3>(
  (Object.entries(COUNTRY_DB_NAMES) as [CountryIso3, string][]).map(([iso3, name]) => [
    normalizeString(name),
    iso3,
  ]),
);

/** Código ISO3 de un país por su nombre (sin distinguir acentos ni mayúsculas); `null` si no está en `COUNTRY_DB_NAMES`. */
export function getCountryIso3(country: string): CountryIso3 | null {
  return ISO3_BY_NAME.get(normalizeString(country)) ?? null;
}

/** Ruta de la bandera de un país (`assets/flags/esp.png`); `null` si el país no tiene código. */
export function getFlagPath(country: string): string | null {
  const iso3 = getCountryIso3(country);
  return iso3 ? `assets/flags/${iso3.toLowerCase()}.png` : null;
}

/** Nombre visible de un país en el idioma de `t`; si no tiene código, el nombre de la BD tal cual. */
export function translateCountry(dbName: string, t: Translations['countries']): string {
  const iso3 = getCountryIso3(dbName);
  return iso3 ? t[iso3] : dbName;
}

/** El país coincide con la búsqueda (ya normalizada) por su nombre de BD o por el del idioma activo. */
export function matchesCountry(
  dbName: string,
  query: string,
  t: Translations['countries'],
): boolean {
  return (
    normalizeString(dbName).includes(query) ||
    normalizeString(translateCountry(dbName, t)).includes(query)
  );
}
