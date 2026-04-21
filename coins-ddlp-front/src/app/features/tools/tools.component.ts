import { Component, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ToolsHeaderComponent } from './components/tools-header/tools-header.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-tools',
  imports: [RouterOutlet, ToolsHeaderComponent],
  templateUrl: './tools.component.html',
  styleUrl: './tools.component.scss',
})
export class ToolsComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    effect(() => {
      if (!this.authService.isLoggedIn()) {
        this.router.navigate(['/euros']);
      }
    });
  }
}
