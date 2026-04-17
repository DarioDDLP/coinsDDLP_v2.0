import { Component, inject, signal, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { AdminService } from '../../services/admin.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AppUser } from '../../../../shared/interfaces/app-user.interface';
import { LITERALS } from '../../../../shared/constants/literals';
import { TOAST_MESSAGES } from '../../../../shared/constants/toast-messages.const';
import { toSignal } from '@angular/core/rxjs-interop';
import { LoadingService } from '../../../../core/services/loading.service';

@Component({
  selector: 'app-admin-users',
  imports: [TableModule, TagModule, TooltipModule, ButtonComponent],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
})
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);
  private messageService = inject(MessageService);
  private loadingService = inject(LoadingService);

  readonly literals = LITERALS.admin;

  readonly users = signal<AppUser[]>([]);
  readonly isReady = signal(false);

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

  protected onEdit(user: AppUser): void {
    // TODO: abrir modal de edición
  }

  protected onDelete(user: AppUser): void {
    // TODO: confirmación y borrado
  }
}
