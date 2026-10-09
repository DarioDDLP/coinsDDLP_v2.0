import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Drawer } from 'primeng/drawer';
import { injectLiterals } from '../../shared/services/i18n.service';
import { APP_VERSION } from '../../shared/constants/app-version.const';
import { AuthService } from '../../core/services/auth.service';
import { injectCan, PermissionsService } from '../../core/services/permissions.service';
import { NumistaService } from '../../core/services/numista.service';
import { LayoutStateService } from '../layout-state.service';
import { isNavItemVisible, NAV_ITEMS, NUMISTA_MONTHLY_QUOTA } from '../navigation.config';
import { userDisplayName, userInitials } from '../user-display';
import { LanguageToggleComponent } from '../../shared/components/language-toggle/language-toggle.component';

/** Panel inferior de móvil con las secciones secundarias, la cuota de Numista y la sesión. */
@Component({
  selector: 'app-more-sheet',
  imports: [LanguageToggleComponent, RouterLink, Drawer],
  templateUrl: './more-sheet.component.html',
  styleUrl: './more-sheet.component.scss',
})
export class MoreSheetComponent {
  readonly layout = inject(LayoutStateService);
  readonly authService = inject(AuthService);
  readonly numistaService = inject(NumistaService);
  private permissions = inject(PermissionsService);
  readonly canViewQuota = injectCan('numista.quotaView');

  readonly literals = injectLiterals('nav');
  readonly authLiterals = injectLiterals('auth');
  readonly quota = NUMISTA_MONTHLY_QUOTA;
  readonly version = APP_VERSION;

  readonly items = computed(() =>
    NAV_ITEMS.filter(
      (i) =>
        !i.mobilePrimary &&
        isNavItemVisible(i, this.authService.isAdmin(), this.permissions.granted()),
    ),
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
