import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ADMIN_NAV_ITEMS, AdminNavItem } from './admin-header.config';
import { LITERALS } from '../../../../shared/constants/literals';

@Component({
  selector: 'app-admin-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-header.component.html',
  styleUrl: './admin-header.component.scss',
})
export class AdminHeaderComponent {
  readonly title = LITERALS.admin.title;
  readonly items: AdminNavItem[] = ADMIN_NAV_ITEMS;
}
