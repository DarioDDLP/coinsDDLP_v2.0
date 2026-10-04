import { Component, computed, input, output } from '@angular/core';
import { ButtonComponent } from '../button/button.component';

/** neutral → sin datos · success → buena noticia (p. ej. no falta ninguna) · error → fallo de carga */
export type EmptyPanelTone = 'neutral' | 'success' | 'error';

@Component({
  selector: 'app-empty-panel',
  imports: [ButtonComponent],
  templateUrl: './empty-panel.component.html',
  styleUrl: './empty-panel.component.scss',
  host: {
    '[class.compact]': 'compact()',
  },
})
export class EmptyPanelComponent {
  readonly icon = input<string>('pi-inbox');
  readonly title = input.required<string>();
  readonly message = input<string>('');
  readonly tone = input<EmptyPanelTone>('neutral');
  /** Versión reducida para dentro de una ficha. */
  readonly compact = input<boolean>(false);
  /** Si hay texto, muestra un botón que emite `action`. */
  readonly actionLabel = input<string>('');
  readonly actionIcon = input<string>('');

  readonly action = output<void>();

  /** Un error se anuncia de inmediato; el resto, de forma discreta. */
  readonly role = computed(() => (this.tone() === 'error' ? 'alert' : 'status'));
}
