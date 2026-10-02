import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { LITERALS } from '../../constants/literals';

export type ProgressStatSize = 'sm' | 'md' | 'lg';

/** Progreso de colección: "tengo / total", porcentaje y barra dorada. */
@Component({
  selector: 'app-progress-stat',
  imports: [DecimalPipe],
  templateUrl: './progress-stat.component.html',
  styleUrl: './progress-stat.component.scss',
  host: {
    '[class]': "'size-' + size()",
  },
})
export class ProgressStatComponent {
  readonly owned = input.required<number>();
  readonly total = input.required<number>();
  readonly size = input<ProgressStatSize>('md');
  /** Texto a la izquierda de la cifra (p. ej. "Progreso total"). */
  readonly label = input<string>('');

  readonly percent = computed(() => {
    const total = this.total();
    return total > 0 ? Math.round((this.owned() / total) * 100) : 0;
  });

  readonly ariaLabel = computed(
    () => `${this.label() || LITERALS.shared.progress}: ${this.owned()} / ${this.total()}`,
  );
}
