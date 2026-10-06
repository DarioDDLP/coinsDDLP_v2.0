import { EuroCoin } from '../../../shared/interfaces/euro-coin.interface';
import { normalizeString } from '../../../shared/helpers/normalize-strings.helper';
import { FACE_VALUE_ORDER } from '../../../shared/constants/face-value-order.const';

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
