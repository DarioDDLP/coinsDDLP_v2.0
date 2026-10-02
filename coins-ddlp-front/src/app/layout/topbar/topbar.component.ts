import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LITERALS } from '../../shared/constants/literals';
import { PageHeaderService } from '../../shared/services/page-header.service';
import { CountryFlagComponent } from '../../shared/components/country-flag/country-flag.component';
import { AuthService } from '../../core/services/auth.service';
import { LayoutStateService } from '../layout-state.service';
import { NAV_ITEMS } from '../navigation.config';
import { userInitials } from '../user-display';

/** Barra superior de móvil: atrás, título de la página y acceso a la cuenta. */
@Component({
  selector: 'app-topbar',
  imports: [RouterLink, CountryFlagComponent],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
})
export class TopbarComponent {
  readonly layout = inject(LayoutStateService);
  readonly authService = inject(AuthService);
  private pageHeader = inject(PageHeaderService);

  readonly literals = LITERALS.nav;
  readonly authLiterals = LITERALS.auth;

  readonly header = this.pageHeader.header;

  /** Título: el de la página, o el de la sección activa si la página no lo ha fijado. */
  readonly title = computed(() => {
    const fromPage = this.header()?.title;
    if (fromPage) return fromPage;
    const url = this.layout.currentUrl();
    return NAV_ITEMS.find((i) => url.startsWith(i.routerLink))?.label ?? this.literals.brand;
  });

  readonly initials = computed(() => userInitials(this.authService.currentUser()));
}
