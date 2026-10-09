import { Component, computed, ErrorHandler, inject, signal, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { AdminService } from '../../services/admin.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import { AdminUserDialogComponent } from '../admin-user-dialog/admin-user-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { AppUser } from '../../../../shared/interfaces/app-user.interface';
import { I18nService, injectLiterals } from '../../../../shared/services/i18n.service';
import { TOAST_MESSAGES } from '../../../../shared/constants/toast-messages.const';
import { getRoleBadge } from '../../../../shared/helpers/badge.helpers';
import { Permission } from '../../../../shared/constants/permissions.const';

@Component({
  selector: 'app-admin-users',
  imports: [
    TableModule,
    SkeletonComponent,
    ButtonComponent,
    AdminUserDialogComponent,
    ConfirmDialogComponent,
    BadgeComponent,
  ],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
})
export class AdminUsersComponent implements OnInit {
  private i18n = inject(I18nService);
  private adminService = inject(AdminService);
  private messageService = inject(MessageService);
  private errorHandler = inject(ErrorHandler);

  readonly literals = injectLiterals('admin');

  readonly users = signal<AppUser[]>([]);
  readonly userRows = computed(() =>
    [...this.users()]
      .sort((a, b) => {
        const roleOrder = (r: string | null) => (r === 'admin' ? 0 : 1);
        const roleDiff = roleOrder(a.role) - roleOrder(b.role);
        if (roleDiff !== 0) return roleDiff;
        return (a.email ?? '').localeCompare(b.email ?? '');
      })
      .map((user) => ({ user, roleBadge: getRoleBadge(user.role, this.literals()) })),
  );
  readonly isReady = signal(false);
  readonly dialogVisible = signal(false);
  readonly editingUser = signal<AppUser | null>(null);
  readonly editingGuest = signal(false);
  readonly guestPermissions = signal<Permission[]>([]);
  readonly deleteDialogVisible = signal(false);
  readonly deletingUser = signal<AppUser | null>(null);
  readonly deleteLoading = signal(false);

  ngOnInit(): void {
    this.loadUsers();
    this.loadGuestPermissions();
  }

  protected loadUsers(): void {
    this.adminService.getUsers().subscribe({
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

  protected loadGuestPermissions(): void {
    this.adminService.getGuestPermissions().subscribe({
      next: (permissions) => this.guestPermissions.set(permissions),
      error: (e) => this.errorHandler.handleError(e),
    });
  }

  protected onEdit(user: AppUser | null): void {
    this.editingGuest.set(false);
    this.editingUser.set(user);
    this.dialogVisible.set(true);
  }

  protected onEditGuest(): void {
    this.editingGuest.set(true);
    this.editingUser.set(null);
    this.dialogVisible.set(true);
  }

  protected onSaved(): void {
    if (this.editingGuest()) this.loadGuestPermissions();
    else this.loadUsers();
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
        this.messageService.add(this.i18n.toast(TOAST_MESSAGES.admin.deleteSuccess));
        this.deleteLoading.set(false);
        this.deleteDialogVisible.set(false);
        this.loadUsers();
      },
      error: (e) => {
        this.errorHandler.handleError(e);
        this.deleteLoading.set(false);
      },
    });
  }
}
