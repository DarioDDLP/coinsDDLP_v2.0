import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MessageService } from 'primeng/api';
import { SIDEBAR_ITEMS, SidebarItem } from './sidebar.config';
import { LITERALS } from '../../constants/literals';
import { CountryFlagComponent } from '../country-flag/country-flag.component';
import { ButtonComponent } from '../button/button.component';
import { LoginDialogComponent } from '../login-dialog/login-dialog.component';
import { NumistaService } from '../../../core/services/numista.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, CountryFlagComponent, ButtonComponent, LoginDialogComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  readonly items: SidebarItem[] = SIDEBAR_ITEMS;
  readonly literals = LITERALS.sidebar;
  readonly authLiterals = LITERALS.auth;
  readonly numistaService = inject(NumistaService);
  readonly authService = inject(AuthService);
  private messageService = inject(MessageService);

  readonly loginVisible = signal(false);

  async logout(): Promise<void> {
    await this.authService.logout();
    this.messageService.add({ severity: 'info', summary: this.authLiterals.logoutSuccess, life: 3000 });
  }
}
