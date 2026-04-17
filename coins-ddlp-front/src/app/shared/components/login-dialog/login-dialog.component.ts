import { Component, inject, input, output, signal } from '@angular/core';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';
import { ButtonComponent } from '../button/button.component';
import { LITERALS } from '../../constants/literals';

@Component({
  selector: 'app-login-dialog',
  imports: [Dialog, InputText, ButtonComponent],
  templateUrl: './login-dialog.component.html',
  styleUrl: './login-dialog.component.scss',
})
export class LoginDialogComponent {
  private authService = inject(AuthService);
  private messageService = inject(MessageService);

  visible = input<boolean>(false);
  closed = output<void>();

  readonly literals = LITERALS.auth;

  readonly email = signal('');
  readonly password = signal('');
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  async onSubmit(): Promise<void> {
    this.errorMessage.set('');
    this.loading.set(true);
    try {
      await this.authService.login(this.email(), this.password());
      this.messageService.add({ severity: 'success', summary: this.literals.loginSuccess, life: 3000 });
      this.close();
    } catch {
      this.errorMessage.set(this.literals.loginError);
    } finally {
      this.loading.set(false);
    }
  }

  onHide(): void {
    this.close();
  }

  private close(): void {
    this.email.set('');
    this.password.set('');
    this.errorMessage.set('');
    this.closed.emit();
  }
}
