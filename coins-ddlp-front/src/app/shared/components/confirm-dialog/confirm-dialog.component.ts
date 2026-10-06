import { Component, input, model, output, computed } from '@angular/core';
import { DialogComponent } from '../dialog/dialog.component';
import { ButtonComponent } from '../button/button.component';
import { injectLiterals } from '../../services/i18n.service';

@Component({
  selector: 'app-confirm-dialog',
  imports: [DialogComponent, ButtonComponent],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {
  readonly visible = model(false);
  readonly header = input<string>('');
  readonly message = input<string>('');
  /** Por defecto, "Confirmar" en el idioma activo. */
  readonly confirmLabel = input<string>('');
  /** Mientras dura la acción el diálogo no se puede cerrar. */
  readonly loading = input<boolean>(false);

  readonly confirmed = output<void>();

  readonly literals = injectLiterals('shared');
  readonly confirmText = computed(() => this.confirmLabel() || this.literals().confirm);
}
