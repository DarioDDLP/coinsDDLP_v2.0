import { Component, input, output } from '@angular/core';
import { Dialog } from 'primeng/dialog';
import { ButtonComponent } from '../button/button.component';
import { LITERALS } from '../../constants/literals';

@Component({
  selector: 'app-confirm-dialog',
  imports: [Dialog, ButtonComponent],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {
  visible      = input<boolean>(false);
  header       = input<string>('');
  message      = input<string>('');
  confirmLabel = input<string>(LITERALS.shared.confirm);
  loading      = input<boolean>(false);

  confirmed = output<void>();
  closed    = output<void>();

  readonly cancelLabel = LITERALS.shared.cancel;
}
