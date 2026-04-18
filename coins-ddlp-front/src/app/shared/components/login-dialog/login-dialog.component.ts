import { Component, computed, effect, ErrorHandler, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';
import { ButtonComponent } from '../button/button.component';
import { LITERALS } from '../../constants/literals';
import { TOAST_MESSAGES } from '../../constants/toast-messages.const';

@Component({
  selector: 'app-login-dialog',
  imports: [Dialog, InputText, ButtonComponent],
  templateUrl: './login-dialog.component.html',
  styleUrl: './login-dialog.component.scss',
})
export class LoginDialogComponent {
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private errorHandler = inject(ErrorHandler);
  private router = inject(Router);

  visible = input<boolean>(false);
  mode = input<'login' | 'logout'>('login');
  closed = output<void>();

  readonly literals = LITERALS.auth;
  readonly sharedLiterals = LITERALS.shared;

  readonly email = signal('');
  readonly password = signal('');
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly resetSent = signal(false);
  readonly view = signal<'login' | 'logout' | 'forgot'>('login');

  readonly header = computed(() => {
    if (this.view() === 'logout') return this.literals.logoutButton;
    if (this.view() === 'forgot') return this.literals.forgotTitle;
    return this.literals.loginTitle;
  });

  constructor() {
    effect(() => {
      this.view.set(this.mode() as 'login' | 'logout');
    });
  }

  async onSubmit(): Promise<void> {
    this.errorMessage.set('');
    this.loading.set(true);
    try {
      await this.authService.login(this.email(), this.password());
      this.messageService.add({ ...TOAST_MESSAGES.auth.loginSuccess, life: 3000 });
      this.close();
    } catch (e) {
      this.errorHandler.handleError(e);
      this.errorMessage.set(this.literals.loginError);
    } finally {
      this.loading.set(false);
    }
  }

  async onConfirmLogout(): Promise<void> {
    await this.authService.logout();
    this.messageService.add({ ...TOAST_MESSAGES.auth.logoutSuccess, life: 3000 });
    this.close();
    this.router.navigate(['/euros']);
  }

  async onResetPassword(): Promise<void> {
    this.errorMessage.set('');
    this.loading.set(true);
    try {
      await this.authService.resetPassword(this.email());
      this.resetSent.set(true);
    } catch (e) {
      this.errorHandler.handleError(e);
      this.errorMessage.set(this.literals.resetError);
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
    this.resetSent.set(false);
    this.view.set('login');
    this.closed.emit();
  }
}
