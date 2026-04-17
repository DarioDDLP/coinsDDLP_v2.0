import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { AdminService } from '../../services/admin.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AdminUserDialogComponent } from '../admin-user-dialog/admin-user-dialog.component';
import { RoleBadgeComponent } from '../../../../shared/components/role-badge/role-badge.component';
import { AppUser } from '../../../../shared/interfaces/app-user.interface';
import { LITERALS } from '../../../../shared/constants/literals';
import { LoadingService } from '../../../../core/services/loading.service';

@Component({
  selector: 'app-admin-users',
  imports: [TableModule, TooltipModule, ButtonComponent, AdminUserDialogComponent, RoleBadgeComponent],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
})
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);
  private messageService = inject(MessageService);
  private loadingService = inject(LoadingService);

  readonly literals = LITERALS.admin;

  readonly users = signal<AppUser[]>([]);
  readonly sortedUsers = computed(() =>
    [...this.users()].sort((a, b) => {
      const roleOrder = (r: string | null) => (r === 'admin' ? 0 : 1);
      const roleDiff = roleOrder(a.role) - roleOrder(b.role);
      if (roleDiff !== 0) return roleDiff;
      return (a.email ?? '').localeCompare(b.email ?? '');
    })
  );
  readonly isReady = signal(false);
  readonly dialogVisible = signal(false);
  readonly editingUser = signal<AppUser | null>(null);

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
        error: () => {
          this.isReady.set(true);
        },
      });
  }

  protected onEdit(user: AppUser | null): void {
    this.editingUser.set(user);
    this.dialogVisible.set(true);
  }

  protected onDialogSaved(): void {
    this.dialogVisible.set(false);
    this.loadUsers();
  }

  protected onDialogClosed(): void {
    this.dialogVisible.set(false);
    this.editingUser.set(null);
  }

  protected onDelete(user: AppUser): void {
    // TODO: confirmación y borrado
  }
}
