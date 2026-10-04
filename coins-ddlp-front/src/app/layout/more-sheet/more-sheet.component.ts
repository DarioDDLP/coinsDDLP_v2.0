import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Drawer } from 'primeng/drawer';
import { LITERALS } from '../../shared/constants/literals';
import { AuthService } from '../../core/services/auth.service';
import { NumistaService } from '../../core/services/numista.service';
import { LayoutStateService } from '../layout-state.service';
import { NAV_ITEMS, NUMISTA_MONTHLY_QUOTA } from '../navigation.config';
import { userDisplayName, userInitials } from '../user-display';

/** Panel inferior de móvil con las secciones secundarias, la cuota de Numista y la sesión. */
@Component({
  selector: 'app-more-sheet',
  imports: [RouterLink, Drawer],
  templateUrl: './more-sheet.component.html',
  styleUrl: './more-sheet.component.scss',
})
export class MoreSheetComponent {
  readonly layout = inject(LayoutStateService);
  readonly authService = inject(AuthService);
  readonly numistaService = inject(NumistaService);

  readonly literals = LITERALS.nav;
  readonly authLiterals = LITERALS.auth;
  readonly quota = NUMISTA_MONTHLY_QUOTA;

  readonly items = computed(() =>
    NAV_ITEMS.filter((i) => !i.mobilePrimary && (!i.adminOnly || this.authService.isAdmin())),
  );

  readonly quotaPercent = computed(() => {
    const remaining = this.numistaService.remaining();
    return remaining === null ? 0 : Math.round((remaining / this.quota) * 100);
  });

  readonly initials = computed(() => userInitials(this.authService.currentUser()));
  readonly displayName = computed(() => userDisplayName(this.authService.currentUser()));

  close(): void {
    this.layout.moreOpen.set(false);
  }
}
