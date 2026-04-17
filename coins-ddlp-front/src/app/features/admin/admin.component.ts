import { Component, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AdminHeaderComponent } from './components/admin-header/admin-header.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin',
  imports: [RouterOutlet, AdminHeaderComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent {
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
