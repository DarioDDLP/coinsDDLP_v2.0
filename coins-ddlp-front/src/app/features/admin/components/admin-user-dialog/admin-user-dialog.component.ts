import { Component, computed, effect, ErrorHandler, inject, input, output, signal } from '@angular/core';
import { Dialog } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { AdminService } from '../../services/admin.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import { SelectComponent } from '../../../../shared/components/select/select.component';
import { AppUser } from '../../../../shared/interfaces/app-user.interface';
import { LITERALS } from '../../../../shared/constants/literals';
import { TOAST_MESSAGES } from '../../../../shared/constants/toast-messages.const';
import { ROLE_OPTIONS } from './admin-user-dialog.config';

@Component({
  selector: 'app-admin-user-dialog',
  imports: [Dialog, ButtonComponent, TextInputComponent, SelectComponent],
  templateUrl: './admin-user-dialog.component.html',
  styleUrl: './admin-user-dialog.component.scss',
})
export class AdminUserDialogComponent {
  private adminService = inject(AdminService);
  private messageService = inject(MessageService);
  private errorHandler = inject(ErrorHandler);

  visible = input<boolean>(false);
  mode = input<'edit' | 'delete'>('edit');
  user = input<AppUser | null>(null);

  saved = output<void>();
  closed = output<void>();

  readonly literals = LITERALS.admin;
  readonly authLiterals = LITERALS.auth;
  readonly sharedLiterals = LITERALS.shared;

  readonly email = signal('');
  readonly password = signal('');
  readonly displayName = signal('');
  readonly role = signal<'user' | 'admin'>('user');
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly isEditMode = computed(() => !!this.user());
  readonly isDeleteMode = computed(() => this.mode() === 'delete');
  readonly header = computed(() => {
    if (this.isDeleteMode()) return this.literals.deleteUser;
    return this.isEditMode() ? this.literals.editTitle : this.literals.createTitle;
  });
  readonly canSubmit = computed(() =>
    this.isEditMode() || (!!this.email() && !!this.password())
  );

  readonly roleOptions = ROLE_OPTIONS;

  constructor() {
    effect(() => {
      const u = this.user();
      this.displayName.set(u?.displayName ?? '');
      this.role.set((u?.role as 'user' | 'admin') ?? 'user');
      this.email.set('');
      this.password.set('');
      this.errorMessage.set('');
    });
  }

  onSubmit(): void {
    this.errorMessage.set('');
    this.loading.set(true);

    const obs$ = this.isEditMode()
      ? this.adminService.updateUser(this.user()!.uid, this.displayName(), this.role())
      : this.adminService.createUser(this.email(), this.password(), this.displayName(), this.role());

    obs$.subscribe({
      next: () => {
        this.messageService.add({ ...TOAST_MESSAGES.admin.saveSuccess, life: 3000 });
        this.loading.set(false);
        this.saved.emit();
        this.close();
      },
      error: (e) => {
        this.errorHandler.handleError(e);
        this.errorMessage.set(this.literals.saveError);
        this.loading.set(false);
      },
    });
  }

  onConfirmDelete(): void {
    this.loading.set(true);
    this.adminService.deleteUser(this.user()!.uid).subscribe({
      next: () => {
        this.messageService.add({ ...TOAST_MESSAGES.admin.deleteSuccess, life: 3000 });
        this.loading.set(false);
        this.saved.emit();
        this.close();
      },
      error: (e) => {
        this.errorHandler.handleError(e);
        this.errorMessage.set(this.literals.deleteError);
        this.loading.set(false);
      },
    });
  }

  onHide(): void {
    this.close();
  }

  private close(): void {
    this.errorMessage.set('');
    this.loading.set(false);
    this.closed.emit();
  }
}
