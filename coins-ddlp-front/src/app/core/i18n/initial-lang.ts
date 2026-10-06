import { getBrowserLang } from '@jsverse/transloco';
import { Lang } from '../../shared/interfaces/translations.interface';
import { AVAILABLE_LANGS, LANG_STORAGE_KEY } from '../../shared/constants/i18n.const';

/** Idioma al arrancar: el elegido en el selector › el del navegador (español → ES; otro → EN). */
export function getInitialLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (AVAILABLE_LANGS.includes(saved as Lang)) return saved as Lang;
  } catch {
    // Sin almacenamiento: se decide por el navegador
  }
  return getBrowserLang() === 'es' ? 'es' : 'en';
}
