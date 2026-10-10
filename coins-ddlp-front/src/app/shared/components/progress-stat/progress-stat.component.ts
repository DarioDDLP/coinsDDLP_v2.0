import { Component, computed, input, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { injectLiterals, I18nService } from '../../services/i18n.service';
import { OwnedBreakdownItem } from '../../interfaces/owned-count.interface';

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
  readonly lang = inject(I18nService).lang;
  readonly owned = input.required<number>();
  readonly total = input.required<number>();
  readonly size = input<ProgressStatSize>('md');
  /** Texto a la izquierda de la cifra (p. ej. "Progreso total"). */
  readonly label = input<string>('');
  /** Al comparar dos colecciones: obtenidas por cada una, bajo la barra del progreso conjunto. */
  readonly breakdown = input<OwnedBreakdownItem[]>([]);

  private literals = injectLiterals('shared');

  readonly percent = computed(() => {
    const total = this.total();
    return total > 0 ? Math.round((this.owned() / total) * 100) : 0;
  });

  readonly ariaLabel = computed(
    () => `${this.label() || this.literals().progress}: ${this.owned()} / ${this.total()}`,
  );
}
