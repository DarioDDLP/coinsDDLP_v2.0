import { Component, computed, inject, input } from '@angular/core';
import { Popover } from 'primeng/popover';
import { LITERALS } from '../../shared/constants/literals';
import { AuthService } from '../../core/services/auth.service';
import { LayoutStateService } from '../layout-state.service';
import { userDisplayName, userInitials } from '../user-display';

/** Bloque de usuario del sidebar: avatar, nombre y rol, con menú para cerrar sesión. */
@Component({
  selector: 'app-user-menu',
  imports: [Popover],
  templateUrl: './user-menu.component.html',
  styleUrl: './user-menu.component.scss',
})
export class UserMenuComponent {
  readonly layout = inject(LayoutStateService);
  readonly authService = inject(AuthService);

  /** Solo el avatar (sidebar en modo raíl). */
  readonly compact = input(false);

  readonly literals = LITERALS.nav;
  readonly authLiterals = LITERALS.auth;

  readonly initials = computed(() => userInitials(this.authService.currentUser()));
  readonly displayName = computed(() => userDisplayName(this.authService.currentUser()));
}
