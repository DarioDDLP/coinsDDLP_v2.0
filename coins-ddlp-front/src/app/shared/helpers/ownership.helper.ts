import { ComparedNames, OwnedBreakdownItem, OwnedCount } from '../interfaces/owned-count.interface';

/** Una moneda cuenta como "tengo" con unidades; al comparar, si la tiene alguna de las dos colecciones. */
export function isOwned(uds: number, udsAlt: number | undefined, comparing: boolean): boolean {
  return uds > 0 || (comparing && (udsAlt ?? 0) > 0);
}

export function emptyOwnedCount(): OwnedCount {
  return { owned: 0, total: 0, ownedPrimary: 0, ownedCompare: 0 };
}

/** Suma una moneda al recuento (lo modifica). */
export function addToOwnedCount(
  count: OwnedCount,
  row: { uds: number; udsAlt?: number },
  comparing: boolean,
): void {
  count.total++;
  if (isOwned(row.uds, row.udsAlt, comparing)) count.owned++;
  if (row.uds > 0) count.ownedPrimary++;
  if (comparing && (row.udsAlt ?? 0) > 0) count.ownedCompare++;
}

export function countOwned(
  rows: readonly { uds: number; udsAlt?: number }[],
  comparing: boolean,
): OwnedCount {
  const count = emptyOwnedCount();
  for (const row of rows) addToOwnedCount(count, row, comparing);
  return count;
}

/** Desglose por colección para `app-progress-stat`; vacío si no se compara. */
export function ownedBreakdown(count: OwnedCount, names: ComparedNames): OwnedBreakdownItem[] {
  if (!names) return [];
  return [
    { label: names.primary, owned: count.ownedPrimary },
    { label: names.compare, owned: count.ownedCompare },
  ];
}
