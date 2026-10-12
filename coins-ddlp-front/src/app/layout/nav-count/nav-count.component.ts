import { Component, input } from '@angular/core';

/** Contador de novedades junto a un elemento del menú; `dot` lo reduce a un punto (raíl). */
@Component({
  selector: 'app-nav-count',
  template: '{{ dot() ? "" : count() }}',
  styleUrl: './nav-count.component.scss',
  host: {
    role: 'img',
    '[class.dot]': 'dot()',
    '[attr.aria-label]': 'count() + " " + label()',
  },
})
export class NavCountComponent {
  readonly count = input.required<number>();
  /** Texto accesible tras el número ("solicitudes con novedades"). */
  readonly label = input.required<string>();
  readonly dot = input(false);
}
