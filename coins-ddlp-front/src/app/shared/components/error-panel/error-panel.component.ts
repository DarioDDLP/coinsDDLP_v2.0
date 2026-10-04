import { Component, input, output } from '@angular/core';
import { EmptyPanelComponent } from '../empty-panel/empty-panel.component';
import { LITERALS } from '../../constants/literals';

/** Fallo al cargar una vista o ficha: mensaje común y botón Reintentar. El motivo concreto va en el toast. */
@Component({
  selector: 'app-error-panel',
  imports: [EmptyPanelComponent],
  templateUrl: './error-panel.component.html',
})
export class ErrorPanelComponent {
  /** Versión reducida para dentro de una ficha. */
  readonly compact = input<boolean>(false);

  readonly retry = output<void>();

  readonly literals = LITERALS.shared;
}
