import { computed, inject, Injectable, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, Observable } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import {
  Lang,
  ToastDefinition,
  Translations,
  TranslationSection,
} from '../interfaces/translations.interface';
import { LANG_STORAGE_KEY } from '../constants/i18n.const';

/** Texto de un toast ya traducido; encaja con `MessageService.add()`. */
export interface ToastText {
  severity: ToastDefinition['severity'];
  summary: string;
  detail: string;
}

/**
 * Idioma activo y textos de la app (Transloco con `public/i18n/{lang}.json`).
 * Todo lo que pinta texto lo lee a través de signals, así que cambiar de idioma
 * actualiza la interfaz al momento, sin recargar.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private transloco = inject(TranslocoService);

  /** Idioma activo. Solo cambia cuando el diccionario nuevo ya está cargado. */
  readonly lang: Signal<Lang> = toSignal(this.transloco.langChanges$ as Observable<Lang>, {
    initialValue: this.transloco.getActiveLang() as Lang,
  });

  /** Una sección de los textos (`euros`, `shared`…) en el idioma activo. */
  section<K extends TranslationSection>(key: K): Signal<Translations[K]> {
    return computed(() => {
      this.lang();
      return this.transloco.translateObject(key) as Translations[K];
    });
  }

  /** Texto suelto en el idioma activo en este momento (no reactivo). */
  translate(key: string): string {
    return this.transloco.translate(key);
  }

  /** Toast en el idioma activo; `prefix` va delante del detalle (p. ej. una cantidad). */
  toast(message: ToastDefinition, prefix?: string | number): ToastText {
    const detail = this.translate(message.detailKey);
    return {
      severity: message.severity,
      summary: this.translate(message.summaryKey),
      detail: prefix === undefined ? detail : `${prefix} ${detail}`,
    };
  }

  /** Carga el diccionario, cambia el idioma y lo recuerda en este navegador. */
  async setLang(lang: Lang): Promise<void> {
    await firstValueFrom(this.transloco.load(lang));
    this.transloco.setActiveLang(lang);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // Sin almacenamiento (modo privado): el idioma vale solo para esta visita
    }
  }
}

/** Textos de una sección como signal. Llamar en un contexto de inyección. */
export function injectLiterals<K extends TranslationSection>(key: K): Signal<Translations[K]> {
  return inject(I18nService).section(key);
}
