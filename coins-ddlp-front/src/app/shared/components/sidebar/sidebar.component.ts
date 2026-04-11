import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SIDEBAR_ITEMS, SidebarItem } from './sidebar.config';
import { LITERALS } from '../../constants/literals';
import { CountryFlagComponent } from '../country-flag/country-flag.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CountryFlagComponent, ButtonComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  readonly items: SidebarItem[] = SIDEBAR_ITEMS;
  readonly literals = LITERALS.sidebar;
}
