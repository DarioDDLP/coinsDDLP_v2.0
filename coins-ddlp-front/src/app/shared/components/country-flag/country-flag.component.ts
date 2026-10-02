import { Component, computed, input } from '@angular/core';
import { getFlagPath } from '../../helpers/normalize-strings.helper';

@Component({
  selector: 'app-country-flag',
  templateUrl: './country-flag.component.html',
  styleUrl: './country-flag.component.scss',
  host: {
    '[class.ring]': 'ring()',
  },
})
export class CountryFlagComponent {
  readonly country = input.required<string>();
  readonly size = input<number>(32);
  /** Anillo fino alrededor de la bandera para separarla del fondo oscuro. */
  readonly ring = input<boolean>(true);
  /** Decorativa (el nombre del país ya aparece al lado): alt vacío. */
  readonly decorative = input<boolean>(false);

  readonly flagPath = computed(() => getFlagPath(this.country()));
  readonly sizePx = computed(() => `${this.size()}px`);

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).style.visibility = 'hidden';
  }
}
