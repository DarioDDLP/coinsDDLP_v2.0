/**
 * Normaliza un nombre de país para construir la ruta a su imagen de bandera.
 * Convierte a minúsculas, elimina acentos y reemplaza espacios por guiones.
 * Ejemplo: "España" → "espana", "Países Bajos" → "paises-bajos"
 */
export function normalizeCountryName(country: string): string {
  return country
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');
}

export function getFlagPath(country: string): string {
  return `assets/flags/${normalizeCountryName(country)}.png`;
}
