import {
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  untracked,
  computed,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { SearchInputComponent } from '../search-input/search-input.component';
import { CountryFlagComponent } from '../country-flag/country-flag.component';
import { PageHeaderService } from '../../services/page-header.service';
import { injectLiterals } from '../../services/i18n.service';

/**
 * Estructura común de las páginas de colección.
 * Slots: [page-aside] (junto al título, p. ej. progreso), [page-actions] (junto al buscador),
 * [page-filters] (bajo la barra de herramientas) y el contenido por defecto.
 * En móvil el título y el botón atrás se delegan en la barra superior vía PageHeaderService.
 */
@Component({
  selector: 'app-page-layout',
  imports: [RouterLink, SearchInputComponent, CountryFlagComponent],
  templateUrl: './page-layout.component.html',
  styleUrl: './page-layout.component.scss',
})
export class PageLayoutComponent {
  private pageHeader = inject(PageHeaderService);

  readonly title = input.required<string>();
  readonly overline = input<string>('');
  readonly subtitle = input<string>('');
  readonly country = input<string | null | undefined>(null);
  readonly backLink = input<unknown[] | null | undefined>(null);
  readonly backQueryParams = input<Record<string, unknown> | null>(null);
  /** Por defecto, "Volver" en el idioma activo. */
  readonly backLabel = input<string>('');
  private sharedLiterals = injectLiterals('shared');
  readonly backText = computed(() => this.backLabel() || this.sharedLiterals().back);
  readonly searchPlaceholder = input<string>('');
  readonly searchValue = input<string>('');

  readonly searchChange = output<string>();

  constructor() {
    effect(() => {
      const header = {
        title: this.title(),
        backLink: this.backLink() ?? null,
        backQueryParams: this.backQueryParams(),
        country: this.country() ?? null,
      };
      untracked(() => this.pageHeader.set(header));
    });

    inject(DestroyRef).onDestroy(() => {
      // Solo limpia si nadie más ha tomado el relevo (la página siguiente ya puede haberlo fijado)
      if (this.pageHeader.header()?.title === this.title()) this.pageHeader.clear();
    });
  }
}
