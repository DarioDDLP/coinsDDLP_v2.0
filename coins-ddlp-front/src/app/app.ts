import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from 'primeng/toast';
import { LoadingSpinnerComponent } from './shared/components/loading-spinner/loading-spinner.component';
import { LITERALS } from './shared/constants/literals';
import { LoadingService } from './core/services/loading.service';
import { AuthService } from './core/services/auth.service';
import { LayoutStateService } from './layout/layout-state.service';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { TopbarComponent } from './layout/topbar/topbar.component';
import { BottomNavComponent } from './layout/bottom-nav/bottom-nav.component';
import { MoreSheetComponent } from './layout/more-sheet/more-sheet.component';
import { LoginDialogComponent } from './layout/login-dialog/login-dialog.component';
import { RecoveryPasswordDialogComponent } from './layout/recovery-password-dialog/recovery-password-dialog.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    Toast,
    LoadingSpinnerComponent,
    SidebarComponent,
    TopbarComponent,
    BottomNavComponent,
    MoreSheetComponent,
    LoginDialogComponent,
    RecoveryPasswordDialogComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly loadingService = inject(LoadingService);
  readonly authService = inject(AuthService);
  readonly layout = inject(LayoutStateService);
  readonly literals = LITERALS.nav;
}
