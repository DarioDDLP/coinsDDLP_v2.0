import {
  Component,
  computed,
  effect,
  ErrorHandler,
  inject,
  input,
  model,
  signal,
  untracked,
} from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';
import { I18nService, injectLiterals } from '../../shared/services/i18n.service';
import { TOAST_MESSAGES } from '../../shared/constants/toast-messages.const';

@Component({
  selector: 'app-login-dialog',
  imports: [DialogComponent, ButtonComponent, TextInputComponent],
  templateUrl: './login-dialog.component.html',
  styleUrl: './login-dialog.component.scss',
})
export class LoginDialogComponent {
  private i18n = inject(I18nService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private errorHandler = inject(ErrorHandler);
  private router = inject(Router);

  readonly visible = model(false);
  readonly mode = input<'login' | 'logout'>('login');

  readonly literals = injectLiterals('auth');
  readonly sharedLiterals = injectLiterals('shared');

  readonly email = signal('');
  readonly password = signal('');
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly resetSent = signal(false);
  readonly view = signal<'login' | 'logout' | 'forgot'>('login');

  readonly header = computed(() => {
    if (this.view() === 'logout') return this.literals().logoutButton;
    if (this.view() === 'forgot') return this.literals().forgotTitle;
    return this.literals().loginTitle;
  });

  constructor() {
    // La vista se fija al abrir: al cerrar, el modo vuelve a 'login' y no debe verse durante el fundido
    effect(() => {
      if (!this.visible()) return;
      const mode = this.mode();
      untracked(() => this.view.set(mode));
    });
  }

  async onSubmit(): Promise<void> {
    this.errorMessage.set('');
    this.loading.set(true);
    try {
      await this.authService.login(this.email(), this.password());
      this.messageService.add(this.i18n.toast(TOAST_MESSAGES.auth.loginSuccess));
      this.visible.set(false);
    } catch (e) {
      this.errorHandler.handleError(e);
      this.errorMessage.set(this.literals().loginError);
    } finally {
      this.loading.set(false);
    }
  }

  async onConfirmLogout(): Promise<void> {
    this.loading.set(true);
    try {
      await this.authService.logout();
      this.messageService.add(this.i18n.toast(TOAST_MESSAGES.auth.logoutSuccess));
      this.visible.set(false);
      this.router.navigate(['/euros']);
    } catch (e) {
      this.errorHandler.handleError(e);
    } finally {
      this.loading.set(false);
    }
  }

  async onResetPassword(): Promise<void> {
    this.errorMessage.set('');
    this.loading.set(true);
    try {
      await this.authService.resetPassword(this.email());
      this.resetSent.set(true);
    } catch (e) {
      this.errorHandler.handleError(e);
      this.errorMessage.set(this.literals().resetError);
    } finally {
      this.loading.set(false);
    }
  }

  showView(view: 'login' | 'forgot'): void {
    this.errorMessage.set('');
    this.view.set(view);
  }

  /** Tras la animación de cierre: formulario limpio para la próxima vez. */
  onHidden(): void {
    this.email.set('');
    this.password.set('');
    this.errorMessage.set('');
    this.resetSent.set(false);
  }
}
