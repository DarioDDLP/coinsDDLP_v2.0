import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
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

  readonly loginVisible = signal(false);
  readonly dialogMode = signal<'login' | 'logout'>('login');

  openLogin(): void {
    this.dialogMode.set('login');
    this.loginVisible.set(true);
  }

  openLogoutConfirm(): void {
    this.dialogMode.set('logout');
    this.loginVisible.set(true);
  }
}
