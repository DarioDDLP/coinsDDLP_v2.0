import { Component, ErrorHandler, inject, input, output, signal } from '@angular/core';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';
import { ButtonComponent } from '../button/button.component';
import { LITERALS } from '../../constants/literals';
import { TOAST_MESSAGES } from '../../constants/toast-messages.const';

@Component({
  selector: 'app-recovery-password-dialog',
  imports: [Dialog, InputText, ButtonComponent],
  templateUrl: './recovery-password-dialog.component.html',
  styleUrl: './recovery-password-dialog.component.scss',
})
export class RecoveryPasswordDialogComponent {
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private errorHandler = inject(ErrorHandler);

  visible = input<boolean>(false);
  closed = output<void>();

  readonly literals = LITERALS.auth;

  readonly newPassword = signal('');
  readonly confirmPassword = signal('');
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  async onSubmit(): Promise<void> {
    if (this.newPassword() !== this.confirmPassword()) {
      this.errorMessage.set(this.literals.passwordMismatch);
      return;
    }
    this.errorMessage.set('');
    this.loading.set(true);
    try {
      await this.authService.updatePassword(this.newPassword());
      this.messageService.add({ ...TOAST_MESSAGES.auth.recoverySuccess, life: 3000 });
      this.close();
    } catch (e) {
      this.errorHandler.handleError(e);
      this.errorMessage.set(this.literals.recoveryError);
    } finally {
      this.loading.set(false);
    }
  }

  onHide(): void {
    this.close();
  }

  private close(): void {
    this.newPassword.set('');
    this.confirmPassword.set('');
    this.errorMessage.set('');
    this.closed.emit();
  }
}
