import type es from '../../../../public/i18n/es.json';

/**
 * Forma de los textos de la app: la de `public/i18n/es.json`.
 * `en.json` debe tener las mismas claves (lo comprueba `scripts/check-i18n.mjs` antes de cada build).
 */
export type Translations = typeof es;

export type TranslationSection = keyof Translations;

export type Lang = 'es' | 'en';

/** Toast de éxito o info; los textos se resuelven en el idioma activo al lanzarlo. */
export interface ToastDefinition {
  severity: 'success' | 'info';
  summaryKey: string;
  detailKey: string;
}
