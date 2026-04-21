import { Component, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ButtonsHeaderComponent } from '../../shared/components/buttons-header/buttons-header.component';
import { AuthService } from '../../core/services/auth.service';
import { ADMIN_NAV_ITEMS } from './components/admin-header/admin-header.config';
import { LITERALS } from '../../shared/constants/literals';

@Component({
  selector: 'app-admin',
  imports: [RouterOutlet, ButtonsHeaderComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly title = LITERALS.admin.title;
  readonly navItems = ADMIN_NAV_ITEMS;

  constructor() {
    effect(() => {
      if (!this.authService.isLoggedIn()) {
        this.router.navigate(['/euros']);
      }
    });
  }
}
