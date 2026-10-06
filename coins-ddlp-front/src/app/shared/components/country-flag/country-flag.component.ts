import { Component, computed, input } from '@angular/core';
import { getFlagPath } from '../../helpers/country.helper';

@Component({
  selector: 'app-country-flag',
  templateUrl: './country-flag.component.html',
  styleUrl: './country-flag.component.scss',
  host: {
    '[class.ring]': 'ring() && !!flagPath()',
  },
})
export class CountryFlagComponent {
  readonly country = input.required<string>();
  readonly size = input<number>(32);
  /** Anillo fino alrededor de la bandera para separarla del fondo oscuro. */
  readonly ring = input<boolean>(true);
  /** Decorativa (el nombre del país ya aparece al lado): alt vacío. */
  readonly decorative = input<boolean>(false);

  /** `null` si el país no está en `COUNTRY_DB_NAMES`: no se pinta nada. */
  readonly flagPath = computed(() => getFlagPath(this.country()));
  /** El tamaño puede sobrescribirse desde CSS con --flag-size (p. ej. en móvil). */
  readonly cssSize = computed(() => `var(--flag-size, ${this.size()}px)`);

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).style.visibility = 'hidden';
  }
}
