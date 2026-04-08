import { Component, computed, input } from '@angular/core';
import { getFlagPath } from '../../helpers/normalize-strings.helper';

@Component({
  selector: 'app-country-flag',
  standalone: true,
  templateUrl: './country-flag.component.html',
  styleUrl: './country-flag.component.scss',
})
export class CountryFlagComponent {
  readonly country = input.required<string>();
  readonly size = input<number>(32);

  readonly flagPath = computed(() => getFlagPath(this.country()));
  readonly sizePx = computed(() => `${this.size()}px`);

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
