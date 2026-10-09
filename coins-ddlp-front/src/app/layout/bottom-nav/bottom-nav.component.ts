import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { injectLiterals } from '../../shared/services/i18n.service';
import { LayoutStateService } from '../layout-state.service';
import { isNavItemVisible, NAV_ITEMS } from '../navigation.config';
import { AuthService } from '../../core/services/auth.service';
import { PermissionsService } from '../../core/services/permissions.service';

/** Barra de pestañas inferior de móvil: secciones principales + "Más". */
@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss',
})
export class BottomNavComponent {
  readonly layout = inject(LayoutStateService);
  readonly literals = injectLiterals('nav');

  private authService = inject(AuthService);
  private permissions = inject(PermissionsService);

  readonly items = computed(() =>
    NAV_ITEMS.filter(
      (i) =>
        i.mobilePrimary &&
        isNavItemVisible(i, this.authService.isAdmin(), this.permissions.granted()),
    ),
  );

  /** "Más" se marca activo cuando la ruta actual pertenece a una sección del panel. */
  readonly moreActive = computed(() => {
    const url = this.layout.currentUrl();
    return (
      this.layout.moreOpen() ||
      NAV_ITEMS.some((i) => !i.mobilePrimary && url.startsWith(i.routerLink))
    );
  });
}
