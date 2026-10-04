import { Component, computed, input, model, output } from '@angular/core';
import { Dialog } from 'primeng/dialog';
import { DIALOG_BREAKPOINTS, DIALOG_WIDTHS, DialogSize } from '../../constants/dialog.const';

/**
 * Único envoltorio de p-dialog: modal, sin arrastrar ni redimensionar, ancho por tamaño y
 * a todo el ancho en móvil. Slots: cuerpo, [dialog-header-start] / [dialog-header-end]
 * alrededor del título y [dialog-footer] para las acciones (fijas abajo si el cuerpo hace scroll).
 */
@Component({
  selector: 'app-dialog',
  imports: [Dialog],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
})
export class DialogComponent {
  readonly visible = model(false);
  readonly header = input('');
  readonly size = input<DialogSize>('md');
  /** false: sin botón de cerrar ni Escape. */
  readonly closable = input(true);
  /** Cerrar al pulsar fuera del diálogo. */
  readonly dismissable = input(false);

  /** Al terminar la animación de cierre: momento de resetear el estado del formulario. */
  readonly hidden = output<void>();

  /** Alias de header(): en la plantilla, la referencia #header de PrimeNG tapa al input. */
  readonly title = computed(() => this.header());
  readonly breakpoints = DIALOG_BREAKPOINTS;
  readonly style = computed(() => ({ width: DIALOG_WIDTHS[this.size()] }));
}
