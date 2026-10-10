import { ConservationCode, RawOwnership } from '../interfaces/euro-coin.interface';

export interface PickedOwnership {
  uds: number;
  conservation: ConservationCode;
  observations?: string;
  udsAlt?: number;
  conservationAlt?: ConservationCode;
  observationsAlt?: string;
}

/**
 * Datos de posesión de una moneda para la colección principal y, si se compara,
 * los de la segunda en los campos `*Alt`. Sin fila de posesión: 0 uds y `ND`.
 */
export function pickOwnership(
  rows: Partial<RawOwnership>[] | null,
  primaryId: string | null,
  compareId: string | null,
): PickedOwnership {
  const find = (id: string | null) => (rows ?? []).find((o) => o.ownerId === id);
  const primary = find(primaryId);
  const result: PickedOwnership = {
    uds: primary?.uds ?? 0,
    conservation: (primary?.conservation ?? 'ND') as ConservationCode,
    observations: primary?.observations,
  };
  if (compareId) {
    const other = find(compareId);
    result.udsAlt = other?.uds ?? 0;
    result.conservationAlt = (other?.conservation ?? 'ND') as ConservationCode;
    result.observationsAlt = other?.observations;
  }
  return result;
}

/** Ids de colección para filtrar `euro_ownership`: la principal y la comparada. */
export function ownerIdsOf(primaryId: string | null, compareId: string | null): string[] {
  return [primaryId, compareId].filter((id): id is string => id !== null);
}
