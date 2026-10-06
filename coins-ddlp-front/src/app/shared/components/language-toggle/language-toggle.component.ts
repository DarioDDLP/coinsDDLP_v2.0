import { Component, computed, ErrorHandler, inject, input, signal } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import { I18nService, injectLiterals } from '../../services/i18n.service';
import { Lang } from '../../interfaces/translations.interface';

interface LangOption {
  lang: Lang;
  short: string;
  name: string;
}

/**
 * Selector de idioma ES | EN. Cambia la interfaz al momento, sin recargar.
 * `compact` (sidebar en modo raíl): un solo botón que alterna, con tooltip.
 */
@Component({
  selector: 'app-language-toggle',
  imports: [TooltipModule],
  templateUrl: './language-toggle.component.html',
  styleUrl: './language-toggle.component.scss',
})
export class LanguageToggleComponent {
  private i18n = inject(I18nService);
  private errorHandler = inject(ErrorHandler);

  readonly compact = input(false);

  readonly literals = injectLiterals('nav');
  readonly lang = this.i18n.lang;
  readonly changing = signal(false);

  readonly options = computed<LangOption[]>(() => [
    { lang: 'es', short: 'ES', name: this.literals().languageSpanish },
    { lang: 'en', short: 'EN', name: this.literals().languageEnglish },
  ]);

  /** En modo compacto: el idioma al que se cambiaría. */
  readonly next = computed(() => this.options().find((o) => o.lang !== this.lang())!);

  async select(lang: Lang): Promise<void> {
    if (lang === this.lang() || this.changing()) return;
    this.changing.set(true);
    try {
      await this.i18n.setLang(lang);
    } catch (e) {
      this.errorHandler.handleError(e);
    } finally {
      this.changing.set(false);
    }
  }
}
