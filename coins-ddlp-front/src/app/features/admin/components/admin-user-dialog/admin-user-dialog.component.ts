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
import { Observable } from 'rxjs';
import { MessageService } from 'primeng/api';
import { AdminService } from '../../services/admin.service';
import { DialogComponent } from '../../../../shared/components/dialog/dialog.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import { SelectComponent } from '../../../../shared/components/select/select.component';
import { ToggleComponent } from '../../../../shared/components/toggle/toggle.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AppUser } from '../../../../shared/interfaces/app-user.interface';
import { I18nService, injectLiterals } from '../../../../shared/services/i18n.service';
import { TOAST_MESSAGES } from '../../../../shared/constants/toast-messages.const';
import {
  getPermissionLabelKey,
  GUEST_PERMISSIONS,
  Permission,
  PERMISSION_GROUPS,
} from '../../../../shared/constants/permissions.const';
import { getRoleOptions } from './admin-user-dialog.config';

@Component({
  selector: 'app-admin-user-dialog',
  imports: [
    DialogComponent,
    ButtonComponent,
    TextInputComponent,
    SelectComponent,
    ToggleComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './admin-user-dialog.component.html',
  styleUrl: './admin-user-dialog.component.scss',
})
export class AdminUserDialogComponent {
  private i18n = inject(I18nService);
  private adminService = inject(AdminService);
  private messageService = inject(MessageService);
  private errorHandler = inject(ErrorHandler);

  readonly visible = model(false);
  readonly user = input<AppUser | null>(null);
  /** Modo perfil Invitado: solo permisos de consulta, sin datos de usuario. */
  readonly guest = input(false);
  /** Permisos actuales del Invitado (en modo `guest`). */
  readonly guestPermissions = input<Permission[]>([]);

  readonly saved = output<void>();

  readonly literals = injectLiterals('admin');
  readonly authLiterals = injectLiterals('auth');
  readonly sharedLiterals = injectLiterals('shared');

  readonly email = signal('');
  readonly password = signal('');
  readonly displayName = signal('');
  readonly role = signal<'user' | 'admin'>('user');
  readonly permissions = signal<ReadonlySet<Permission>>(new Set());
  readonly hasCollection = signal(false);
  readonly isDefaultCollection = signal(false);
  readonly loading = signal(false);
  readonly recoveryLoading = signal(false);
  /** Confirmación antes de quitar una colección con monedas guardadas. */
  readonly removeCollectionVisible = signal(false);

  /** La colección por defecto no se puede quitar ni desmarcar: se marca otra en su lugar. */
  readonly wasDefaultCollection = computed(() => !!this.user()?.collection?.isDefault);
  readonly removeCollectionMessage = computed(
    () => `${this.literals().removeCollectionMessage} ${this.user()?.collection?.units ?? 0}`,
  );

  readonly isEditMode = computed(() => !!this.user());
  readonly isAdminRole = computed(() => !this.guest() && this.role() === 'admin');
  readonly header = computed(() => {
    if (this.guest()) return this.literals().guestTitle;
    return this.isEditMode() ? this.literals().editTitle : this.literals().createTitle;
  });
  readonly canSubmit = computed(
    () => this.guest() || this.isEditMode() || (!!this.email() && !!this.password()),
  );

  readonly roleOptions = computed(() => getRoleOptions(this.literals()));

  /** Grupos de interruptores con sus textos; en modo Invitado solo los de consulta. */
  readonly permissionGroups = computed(() => {
    const t = this.literals().permissions;
    const allowed = (p: Permission) => !this.guest() || GUEST_PERMISSIONS.includes(p);
    return PERMISSION_GROUPS.map((g) => ({
      label: t.groups[g.labelKey],
      items: g.permissions
        .filter(allowed)
        .map((p) => ({ key: p, label: t.items[getPermissionLabelKey(p)] })),
    })).filter((g) => g.items.length > 0);
  });

  constructor() {
    // Al abrir se cargan los datos del usuario (vacíos si es nuevo) o del Invitado
    effect(() => {
      if (!this.visible()) return;
      const u = this.user();
      const isGuest = this.guest();
      const guestPermissions = this.guestPermissions();
      untracked(() => {
        this.displayName.set(u?.displayName ?? '');
        this.role.set((u?.role as 'user' | 'admin') ?? 'user');
        this.email.set('');
        this.password.set('');
        this.permissions.set(new Set(isGuest ? guestPermissions : (u?.permissions ?? [])));
        this.hasCollection.set(!!u?.collection);
        this.isDefaultCollection.set(!!u?.collection?.isDefault);
      });
    });
  }

  onTogglePermission(permission: Permission, enabled: boolean): void {
    const next = new Set(this.permissions());
    if (enabled) next.add(permission);
    else next.delete(permission);
    this.permissions.set(next);
  }

  onToggleCollection(enabled: boolean): void {
    this.hasCollection.set(enabled);
    if (!enabled) this.isDefaultCollection.set(false);
  }

  onSubmit(): void {
    const units = this.user()?.collection?.units ?? 0;
    if (!this.guest() && !this.hasCollection() && units > 0) {
      this.removeCollectionVisible.set(true);
      return;
    }
    this.save();
  }

  onConfirmRemoveCollection(): void {
    this.removeCollectionVisible.set(false);
    this.save();
  }

  private save(): void {
    this.loading.set(true);
    const permissions = [...this.permissions()];
    const collection = {
      hasCollection: this.hasCollection(),
      isDefaultCollection: this.hasCollection() && this.isDefaultCollection(),
    };

    let obs$: Observable<unknown>;
    if (this.guest()) {
      obs$ = this.adminService.updateGuestPermissions(permissions);
    } else if (this.isEditMode()) {
      obs$ = this.adminService.updateUser(
        this.user()!.uid,
        this.displayName(),
        this.role(),
        permissions,
        collection,
      );
    } else {
      obs$ = this.adminService.createUser(
        this.email(),
        this.password(),
        this.displayName(),
        this.role(),
        permissions,
        collection,
      );
    }

    obs$.subscribe({
      next: () => {
        this.messageService.add(this.i18n.toast(TOAST_MESSAGES.admin.saveSuccess));
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

  onSendRecovery(): void {
    const user = this.user();
    if (!user) return;
    this.recoveryLoading.set(true);
    this.adminService.sendRecoveryEmail(user.uid).subscribe({
      next: () => {
        this.messageService.add(this.i18n.toast(TOAST_MESSAGES.admin.recoverySent));
        this.recoveryLoading.set(false);
      },
      error: (e) => {
        this.errorHandler.handleError(e);
        this.recoveryLoading.set(false);
      },
    });
  }
}
