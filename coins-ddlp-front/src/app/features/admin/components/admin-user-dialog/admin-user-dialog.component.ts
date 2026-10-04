import {
  Component,
  computed,
  effect,
  ErrorHandler,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
} from '@angular/core';
import { MessageService } from 'primeng/api';
import { AdminService } from '../../services/admin.service';
import { DialogComponent } from '../../../../shared/components/dialog/dialog.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import { SelectComponent } from '../../../../shared/components/select/select.component';
import { AppUser } from '../../../../shared/interfaces/app-user.interface';
import { LITERALS } from '../../../../shared/constants/literals';
import { TOAST_MESSAGES } from '../../../../shared/constants/toast-messages.const';
import { ROLE_OPTIONS } from './admin-user-dialog.config';

@Component({
  selector: 'app-admin-user-dialog',
  imports: [DialogComponent, ButtonComponent, TextInputComponent, SelectComponent],
  templateUrl: './admin-user-dialog.component.html',
  styleUrl: './admin-user-dialog.component.scss',
})
export class AdminUserDialogComponent {
  private adminService = inject(AdminService);
  private messageService = inject(MessageService);
  private errorHandler = inject(ErrorHandler);

  readonly visible = model(false);
  readonly user = input<AppUser | null>(null);

  readonly saved = output<void>();

  readonly literals = LITERALS.admin;
  readonly authLiterals = LITERALS.auth;
  readonly sharedLiterals = LITERALS.shared;

  readonly email = signal('');
  readonly password = signal('');
  readonly displayName = signal('');
  readonly role = signal<'user' | 'admin'>('user');
  readonly loading = signal(false);

  readonly isEditMode = computed(() => !!this.user());
  readonly header = computed(() =>
    this.isEditMode() ? this.literals.editTitle : this.literals.createTitle,
  );
  readonly canSubmit = computed(() => this.isEditMode() || (!!this.email() && !!this.password()));

  readonly roleOptions = ROLE_OPTIONS;

  constructor() {
    // Al abrir se cargan los datos del usuario (vacíos si es nuevo)
    effect(() => {
      if (!this.visible()) return;
      const u = this.user();
      untracked(() => {
        this.displayName.set(u?.displayName ?? '');
        this.role.set((u?.role as 'user' | 'admin') ?? 'user');
        this.email.set('');
        this.password.set('');
      });
    });
  }

  onSubmit(): void {
    this.loading.set(true);

    const obs$ = this.isEditMode()
      ? this.adminService.updateUser(this.user()!.uid, this.displayName(), this.role())
      : this.adminService.createUser(
          this.email(),
          this.password(),
          this.displayName(),
          this.role(),
        );

    obs$.subscribe({
      next: () => {
        this.messageService.add({ ...TOAST_MESSAGES.admin.saveSuccess, life: 3000 });
        this.loading.set(false);
        this.saved.emit();
        this.visible.set(false);
      },
      error: (e) => {
        this.errorHandler.handleError(e);
        this.loading.set(false);
      },
    });
  }
}
