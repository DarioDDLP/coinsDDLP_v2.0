import { Component, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ButtonsHeaderComponent } from '../../shared/components/buttons-header/buttons-header.component';
import { AuthService } from '../../core/services/auth.service';
import { TOOLS_NAV_ITEMS } from './components/tools-header/tools-header.config';
import { LITERALS } from '../../shared/constants/literals';

@Component({
  selector: 'app-tools',
  imports: [RouterOutlet, ButtonsHeaderComponent],
  templateUrl: './tools.component.html',
  styleUrl: './tools.component.scss',
})
export class ToolsComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly title = LITERALS.herramientas.title;
  readonly navItems = TOOLS_NAV_ITEMS;

  constructor() {
    effect(() => {
      if (!this.authService.isLoggedIn()) {
        this.router.navigate(['/euros']);
      }
    });
  }
}
