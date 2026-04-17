import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { AdminService } from '../../services/admin.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AppUser } from '../../../../shared/interfaces/app-user.interface';
import { LITERALS } from '../../../../shared/constants/literals';
import { TOAST_MESSAGES } from '../../../../shared/constants/toast-messages.const';
import { ROLE_OPTIONS } from './admin-user-dialog.config';

@Component({
  selector: 'app-admin-user-dialog',
  imports: [Dialog, InputText, Select, FormsModule, ButtonComponent],
  templateUrl: './admin-user-dialog.component.html',
  styleUrl: './admin-user-dialog.component.scss',
})
export class AdminUserDialogComponent {
  private adminService = inject(AdminService);
  private messageService = inject(MessageService);

  visible = input<boolean>(false);
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
  readonly header = computed(() =>
    this.isEditMode() ? this.literals.editTitle : this.literals.createTitle
  );
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
      error: () => {
        this.errorMessage.set(this.literals.saveError);
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
