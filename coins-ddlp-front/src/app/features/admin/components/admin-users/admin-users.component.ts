import { Component, computed, ErrorHandler, inject, signal, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { AdminService } from '../../services/admin.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AdminUserDialogComponent } from '../admin-user-dialog/admin-user-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { AppUser } from '../../../../shared/interfaces/app-user.interface';
import { LITERALS } from '../../../../shared/constants/literals';
import { TOAST_MESSAGES } from '../../../../shared/constants/toast-messages.const';
import { LoadingService } from '../../../../core/services/loading.service';
import { getRoleBadge } from '../../../../shared/helpers/badge.helpers';

@Component({
  selector: 'app-admin-users',
  imports: [TableModule, ButtonComponent, AdminUserDialogComponent, ConfirmDialogComponent, BadgeComponent],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
})
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);
  private messageService = inject(MessageService);
  private loadingService = inject(LoadingService);
  private errorHandler = inject(ErrorHandler);

  readonly literals = LITERALS.admin;

  readonly users = signal<AppUser[]>([]);
  readonly userRows = computed(() =>
    [...this.users()]
      .sort((a, b) => {
        const roleOrder = (r: string | null) => (r === 'admin' ? 0 : 1);
        const roleDiff = roleOrder(a.role) - roleOrder(b.role);
        if (roleDiff !== 0) return roleDiff;
        return (a.email ?? '').localeCompare(b.email ?? '');
      })
      .map(user => ({ user, roleBadge: getRoleBadge(user.role) }))
  );
  readonly isReady             = signal(false);
  readonly dialogVisible       = signal(false);
  readonly editingUser         = signal<AppUser | null>(null);
  readonly deleteDialogVisible = signal(false);
  readonly deletingUser        = signal<AppUser | null>(null);
  readonly deleteLoading       = signal(false);

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.adminService.getUsers()
      .pipe(this.loadingService.withLoading())
      .subscribe({
        next: (users) => {
          this.users.set(users);
          this.isReady.set(true);
        },
        error: (e) => {
          this.errorHandler.handleError(e);
          this.isReady.set(true);
        },
      });
  }

  protected onEdit(user: AppUser | null): void {
    this.editingUser.set(user);
    this.dialogVisible.set(true);
  }

  protected onDelete(user: AppUser): void {
    this.deletingUser.set(user);
    this.deleteDialogVisible.set(true);
  }

  protected onConfirmDelete(): void {
    const user = this.deletingUser();
    if (!user) return;
    this.deleteLoading.set(true);
    this.adminService.deleteUser(user.uid).subscribe({
      next: () => {
        this.messageService.add({ ...TOAST_MESSAGES.admin.deleteSuccess, life: 3000 });
        this.deleteLoading.set(false);
        this.onDeleteDialogClosed();
        this.loadUsers();
      },
      error: (e) => {
        this.errorHandler.handleError(e);
        this.deleteLoading.set(false);
      },
    });
  }

  protected onDialogSaved(): void {
    this.dialogVisible.set(false);
    this.loadUsers();
  }

  protected onDialogClosed(): void {
    this.dialogVisible.set(false);
    this.editingUser.set(null);
  }

  protected onDeleteDialogClosed(): void {
    this.deleteDialogVisible.set(false);
    this.deletingUser.set(null);
  }
}
