/**
 * Progreso de un grupo de monedas. Al comparar dos colecciones, `owned` cuenta las
 * que tiene alguna de las dos y el desglose las de cada una.
 */
export interface OwnedCount {
  owned: number;
  total: number;
  ownedPrimary: number;
  ownedCompare: number;
}

/** Una línea del desglose por colección ("Darío 1.234"). */
export interface OwnedBreakdownItem {
  label: string;
  owned: number;
}

/** Nombres de las dos colecciones comparadas (`null` si no se compara). */
export type ComparedNames = { primary: string; compare: string } | null;
