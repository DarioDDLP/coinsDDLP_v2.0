import { Component, ErrorHandler, inject, model, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';
import { I18nService, injectLiterals } from '../../shared/services/i18n.service';
import { TOAST_MESSAGES } from '../../shared/constants/toast-messages.const';

@Component({
  selector: 'app-recovery-password-dialog',
  imports: [DialogComponent, ButtonComponent, TextInputComponent],
  templateUrl: './recovery-password-dialog.component.html',
  styleUrl: './recovery-password-dialog.component.scss',
})
export class RecoveryPasswordDialogComponent {
  private i18n = inject(I18nService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private errorHandler = inject(ErrorHandler);

  /** Sin botón de cerrar ni Escape: solo se cierra al cambiar la contraseña. */
  readonly visible = model(false);

  readonly literals = injectLiterals('auth');

  readonly newPassword = signal('');
  readonly confirmPassword = signal('');
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  async onSubmit(): Promise<void> {
    if (this.newPassword() !== this.confirmPassword()) {
      this.errorMessage.set(this.literals().passwordMismatch);
      return;
    }
    this.errorMessage.set('');
    this.loading.set(true);
    try {
      await this.authService.updatePassword(this.newPassword());
      this.messageService.add(this.i18n.toast(TOAST_MESSAGES.auth.recoverySuccess));
      this.visible.set(false);
    } catch (e) {
      this.errorHandler.handleError(e);
      this.errorMessage.set(this.literals().recoveryError);
    } finally {
      this.loading.set(false);
    }
  }

  /** Tras la animación de cierre: formulario limpio. */
  onHidden(): void {
    this.newPassword.set('');
    this.confirmPassword.set('');
    this.errorMessage.set('');
  }
}
