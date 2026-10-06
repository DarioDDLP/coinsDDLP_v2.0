import { Lang } from '../interfaces/translations.interface';

export const AVAILABLE_LANGS: Lang[] = ['es', 'en'];

export const DEFAULT_LANG: Lang = 'es';

/** Clave de `localStorage` con el idioma elegido en el selector. */
export const LANG_STORAGE_KEY = 'lang';
