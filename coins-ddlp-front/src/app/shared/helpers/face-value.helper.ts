import { Translations } from '../interfaces/translations.interface';
import { normalizeString } from './normalize-strings.helper';

/** Valor facial del euro en el idioma de `t`; si no está en `faceValues` (p. ej. pesetas), tal cual. */
export function translateFaceValue(value: string, t: Translations['faceValues']): string {
  const labels: Record<string, string> = t;
  return labels[normalizeString(value)] ?? value;
}
