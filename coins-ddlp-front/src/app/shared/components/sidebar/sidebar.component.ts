import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SIDEBAR_ITEMS, SidebarItem } from './sidebar.config';
import { LITERALS } from '../../constants/literals';
import { CountryFlagComponent } from '../country-flag/country-flag.component';
import { ButtonComponent } from '../button/button.component';
import { NumistaService } from '../../../core/services/numista.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, CountryFlagComponent, ButtonComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  readonly items: SidebarItem[] = SIDEBAR_ITEMS;
  readonly literals = LITERALS.sidebar;
  readonly numistaService = inject(NumistaService);
}
