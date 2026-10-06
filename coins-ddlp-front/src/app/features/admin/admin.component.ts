import { Component, computed, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ButtonsHeaderComponent } from '../../shared/components/buttons-header/buttons-header.component';
import { AuthService } from '../../core/services/auth.service';
import { getAdminNavItems } from './components/admin-header/admin-header.config';
import { injectLiterals } from '../../shared/services/i18n.service';

@Component({
  selector: 'app-admin',
  imports: [RouterOutlet, ButtonsHeaderComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  private literals = injectLiterals('admin');
  private navLiterals = injectLiterals('nav');
  readonly title = computed(() => this.literals().title);
  readonly overline = computed(() => this.navLiterals().groupManagement);
  readonly navItems = computed(() => getAdminNavItems(this.literals()));

  constructor() {
    effect(() => {
      if (!this.authService.isLoggedIn()) {
        this.router.navigate(['/euros']);
      }
    });
  }
}
