import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { injectLiterals } from '../../shared/services/i18n.service';
import { APP_VERSION } from '../../shared/constants/app-version.const';
import { NumistaService } from '../../core/services/numista.service';
import { AuthService } from '../../core/services/auth.service';
import { injectCan, PermissionsService } from '../../core/services/permissions.service';
import { LayoutStateService } from '../layout-state.service';
import {
  isNavItemVisible,
  NAV_ITEMS,
  NavGroup,
  NavItem,
  NUMISTA_MONTHLY_QUOTA,
} from '../navigation.config';
import { UserMenuComponent } from '../user-menu/user-menu.component';
import { LanguageToggleComponent } from '../../shared/components/language-toggle/language-toggle.component';

interface NavSection {
  group: NavGroup;
  label: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  imports: [
    LanguageToggleComponent,
    RouterLink,
    RouterLinkActive,
    TooltipModule,
    UserMenuComponent,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  host: {
    '[class.rail]': 'layout.sidebarRail()',
  },
})
export class SidebarComponent {
  readonly layout = inject(LayoutStateService);
  readonly authService = inject(AuthService);
  readonly numistaService = inject(NumistaService);
  private permissions = inject(PermissionsService);
  readonly canViewQuota = injectCan('numista.quotaView');

  readonly literals = injectLiterals('nav');
  readonly authLiterals = injectLiterals('auth');
  readonly quota = NUMISTA_MONTHLY_QUOTA;
  readonly version = APP_VERSION;

  readonly sections = computed<NavSection[]>(() => {
    const isAdmin = this.authService.isAdmin();
    const granted = this.permissions.granted();
    const visible = NAV_ITEMS.filter((i) => isNavItemVisible(i, isAdmin, granted));
    const sections: NavSection[] = [
      { group: 'collection', label: this.literals().groupCollection, items: [] },
      { group: 'management', label: this.literals().groupManagement, items: [] },
    ];
    for (const item of visible) sections.find((s) => s.group === item.group)!.items.push(item);
    return sections.filter((s) => s.items.length > 0);
  });

  readonly quotaPercent = computed(() => {
    const remaining = this.numistaService.remaining();
    return remaining === null ? 0 : Math.round((remaining / this.quota) * 100);
  });
}
