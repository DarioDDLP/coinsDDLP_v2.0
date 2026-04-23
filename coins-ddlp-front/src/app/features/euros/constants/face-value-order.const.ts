import { EuroCoin } from '../../../shared/interfaces/euro-coin.interface';
import { normalizeString } from '../../../shared/helpers/normalize-strings.helper';

export const FACE_VALUE_ORDER: Record<string, number> = {
  '1 centimo':   1,
  '2 centimos':  2,
  '5 centimos':  3,
  '10 centimos': 4,
  '20 centimos': 5,
  '50 centimos': 6,
  '1 euro':      7,
  '2 euros':     8,
};

export function sortByFaceValue(a: EuroCoin, b: EuroCoin): number {
  const mintCompare = (a.mint ?? '').localeCompare(b.mint ?? '');
  if (mintCompare !== 0) return mintCompare;
  const aOrder = FACE_VALUE_ORDER[normalizeString(a.faceValue)] ?? 99;
  const bOrder = FACE_VALUE_ORDER[normalizeString(b.faceValue)] ?? 99;
  if (aOrder !== bOrder) return aOrder - bOrder;
  if (!a.commemorative && b.commemorative) return -1;
  if (a.commemorative && !b.commemorative) return 1;
  return 0;
}
