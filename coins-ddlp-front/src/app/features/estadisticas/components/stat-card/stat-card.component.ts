import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

/** Tarjeta de KPI: icono, etiqueta, cifra grande y una línea de detalle. */
@Component({
  selector: 'app-stat-card',
  imports: [DecimalPipe],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.scss',
  host: {
    '[class.highlight]': 'highlight()',
  },
})
export class StatCardComponent {
  readonly icon = input.required<string>();
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  /** Texto pequeño junto a la cifra (p. ej. "de 5.441"). */
  readonly suffix = input<string>('');
  readonly hint = input<string>('');
  /** Cifra en oro: el KPI principal. */
  readonly highlight = input(false);
}
