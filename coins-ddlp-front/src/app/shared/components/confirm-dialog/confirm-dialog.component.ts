import { Component, input, model, output } from '@angular/core';
import { DialogComponent } from '../dialog/dialog.component';
import { ButtonComponent } from '../button/button.component';
import { LITERALS } from '../../constants/literals';

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
  readonly confirmLabel = input<string>(LITERALS.shared.confirm);
  /** Mientras dura la acción el diálogo no se puede cerrar. */
  readonly loading = input<boolean>(false);

  readonly confirmed = output<void>();

  readonly cancelLabel = LITERALS.shared.cancel;
}
