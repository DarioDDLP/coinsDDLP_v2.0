import { Component, DOCUMENT, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from 'primeng/toast';
import { PrimeNG } from 'primeng/config';
import { I18nService, injectLiterals } from './shared/services/i18n.service';
import { TOAST_BREAKPOINTS } from './shared/constants/toast.const';
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
  readonly authService = inject(AuthService);
  readonly layout = inject(LayoutStateService);
  readonly literals = injectLiterals('nav');
  readonly toastBreakpoints = TOAST_BREAKPOINTS;

  constructor() {
    const document = inject(DOCUMENT);
    const primeng = inject(PrimeNG);
    const i18n = inject(I18nService);
    const primengLiterals = injectLiterals('primeng');

    // El idioma activo llega a <html lang> (lectores de pantalla, guiones) y a los textos internos de PrimeNG
    effect(() => {
      document.documentElement.lang = i18n.lang();
      primeng.setTranslation(primengLiterals());
    });
  }
}
