import { EuroStatsKpis, EuroStatsRow, StatGroup } from '../interfaces/euro-stats.interface';
import { FACE_VALUE_ORDER } from '../constants/face-value-order.const';
import { addToOwnedCount, emptyOwnedCount, isOwned } from './ownership.helper';
import { normalizeString } from './normalize-strings.helper';

/** Agrupa las filas por la clave dada contando obtenidas y total. */
function groupBy(
  rows: EuroStatsRow[],
  both: boolean,
  keyOf: (row: EuroStatsRow) => string,
): Map<string, StatGroup> {
  const groups = new Map<string, StatGroup>();
  for (const row of rows) {
    const key = keyOf(row);
    const group = groups.get(key) ?? { key, label: key, ...emptyOwnedCount() };
    addToOwnedCount(group, row, both);
    groups.set(key, group);
  }
  return groups;
}

function ratio(group: StatGroup): number {
  return group.total > 0 ? group.owned / group.total : 0;
}

function spare(uds: number | undefined): number {
  return Math.max((uds ?? 0) - 1, 0);
}

export function computeKpis(rows: EuroStatsRow[], both: boolean): EuroStatsKpis {
  const kpis: EuroStatsKpis = {
    ...emptyOwnedCount(),
    commemorativeOwned: 0,
    commemorativeTotal: 0,
    units: 0,
    duplicateCoins: 0,
    spareUnits: 0,
    completedCountries: 0,
    countries: 0,
  };

  for (const row of rows) {
    addToOwnedCount(kpis, row, both);
    const owned = isOwned(row.uds, row.udsAlt, both);
    if (row.commemorative) {
      kpis.commemorativeTotal++;
      if (owned) kpis.commemorativeOwned++;
    }
    kpis.units += row.uds + (both ? (row.udsAlt ?? 0) : 0);
    const rowSpare = spare(row.uds) + (both ? spare(row.udsAlt) : 0);
    if (rowSpare > 0) kpis.duplicateCoins++;
    kpis.spareUnits += rowSpare;
  }

  const countries = groupByCountry(rows, both);
  kpis.countries = countries.length;
  kpis.completedCountries = countries.filter((c) => c.total > 0 && c.owned === c.total).length;
  return kpis;
}

/** Países de mayor a menor porcentaje; a igualdad, por nombre. */
export function groupByCountry(rows: EuroStatsRow[], both: boolean): StatGroup[] {
  return [...groupBy(rows, both, (r) => r.country).values()].sort(
    (a, b) => ratio(b) - ratio(a) || a.label.localeCompare(b.label, 'es'),
  );
}

/** Valores faciales de 1 céntimo a 2 euros conmemorativa. */
export function groupByFaceValue(rows: EuroStatsRow[], both: boolean): StatGroup[] {
  const order = (g: StatGroup) => FACE_VALUE_ORDER[normalizeString(g.key)] ?? 99;
  return [...groupBy(rows, both, (r) => r.faceValue).values()].sort(
    (a, b) => order(a) - order(b) || a.label.localeCompare(b.label, 'es'),
  );
}

/** Años del primero al último, incluidos los que no tengan monedas (total 0). */
export function groupByYear(rows: EuroStatsRow[], both: boolean): StatGroup[] {
  const groups = groupBy(rows, both, (r) => String(r.year));
  const years = [...groups.keys()].map(Number);
  if (years.length === 0) return [];

  const result: StatGroup[] = [];
  for (let year = Math.min(...years); year <= Math.max(...years); year++) {
    const key = String(year);
    result.push(groups.get(key) ?? { key, label: key, ...emptyOwnedCount() });
  }
  return result;
}
