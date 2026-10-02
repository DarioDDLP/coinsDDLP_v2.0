import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Popover } from 'primeng/popover';
import { TooltipModule } from 'primeng/tooltip';
import { LITERALS } from '../../shared/constants/literals';
import { NumistaService } from '../../core/services/numista.service';
import { AuthService } from '../../core/services/auth.service';
import { LayoutStateService } from '../layout-state.service';
import { NAV_ITEMS, NavGroup, NavItem, NUMISTA_MONTHLY_QUOTA } from '../navigation.config';
import { userInitials, userDisplayName } from '../user-display';

interface NavSection {
  group: NavGroup;
  label: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, Popover, TooltipModule],
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

  readonly literals = LITERALS.nav;
  readonly authLiterals = LITERALS.auth;
  readonly quota = NUMISTA_MONTHLY_QUOTA;

  readonly sections = computed<NavSection[]>(() => {
    const isAdmin = this.authService.isAdmin();
    const visible = NAV_ITEMS.filter((i) => !i.adminOnly || isAdmin);
    const sections: NavSection[] = [
      { group: 'collection', label: this.literals.groupCollection, items: [] },
      { group: 'management', label: this.literals.groupManagement, items: [] },
    ];
    for (const item of visible) sections.find((s) => s.group === item.group)!.items.push(item);
    return sections.filter((s) => s.items.length > 0);
  });

  readonly quotaPercent = computed(() => {
    const remaining = this.numistaService.remaining();
    return remaining === null ? 0 : Math.round((remaining / this.quota) * 100);
  });

  readonly initials = computed(() => userInitials(this.authService.currentUser()));
  readonly displayName = computed(() => userDisplayName(this.authService.currentUser()));
}
