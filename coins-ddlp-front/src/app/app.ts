import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from 'primeng/toast';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { LoadingSpinnerComponent } from './shared/components/loading-spinner/loading-spinner.component';
import { RecoveryPasswordDialogComponent } from './shared/components/recovery-password-dialog/recovery-password-dialog.component';
import { LoadingService } from './core/services/loading.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SidebarComponent, LoadingSpinnerComponent, Toast, RecoveryPasswordDialogComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly loadingService = inject(LoadingService);
  readonly authService = inject(AuthService);
}
