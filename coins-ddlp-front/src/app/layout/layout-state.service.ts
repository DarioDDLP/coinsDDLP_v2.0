import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';

export type Viewport = 'mobile' | 'tablet' | 'desktop';
export type AuthDialogMode = 'login' | 'logout';

const MOBILE_QUERY = '(max-width: 767px)';
const DESKTOP_QUERY = '(min-width: 1280px)';
const COLLAPSED_KEY = 'layout-sidebar-collapsed';

/** Estado de la interfaz del shell: viewport, sidebar plegado, panel "Más" y diálogo de login. */
@Injectable({ providedIn: 'root' })
export class LayoutStateService {
  private router = inject(Router);

  readonly viewport = signal<Viewport>(this.readViewport());
  readonly isMobile = computed(() => this.viewport() === 'mobile');

  readonly sidebarCollapsed = signal(this.readCollapsed());
  /** El sidebar se muestra como raíl de iconos en tablet o si el usuario lo ha plegado. */
  readonly sidebarRail = computed(
    () =>
      this.viewport() === 'tablet' || (this.viewport() === 'desktop' && this.sidebarCollapsed()),
  );

  readonly moreOpen = signal(false);
  readonly authDialog = signal<AuthDialogMode | null>(null);
  /** Diálogo para que el usuario con sesión cambie su contraseña. */
  readonly changePasswordOpen = signal(false);

  readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  constructor() {
    const mobile = window.matchMedia(MOBILE_QUERY);
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const update = () => this.viewport.set(this.readViewport());
    mobile.addEventListener('change', update);
    desktop.addEventListener('change', update);
    inject(DestroyRef).onDestroy(() => {
      mobile.removeEventListener('change', update);
      desktop.removeEventListener('change', update);
    });
  }

  toggleSidebar(): void {
    const next = !this.sidebarCollapsed();
    this.sidebarCollapsed.set(next);
    try {
      localStorage.setItem(COLLAPSED_KEY, String(next));
    } catch {
      // almacenamiento no disponible: la preferencia solo dura la sesión
    }
  }

  openLogin(): void {
    this.moreOpen.set(false);
    this.authDialog.set('login');
  }

  openChangePassword(): void {
    this.moreOpen.set(false);
    this.changePasswordOpen.set(true);
  }

  openLogout(): void {
    this.moreOpen.set(false);
    this.authDialog.set('logout');
  }

  closeAuthDialog(): void {
    this.authDialog.set(null);
  }

  private readViewport(): Viewport {
    if (window.matchMedia(MOBILE_QUERY).matches) return 'mobile';
    if (window.matchMedia(DESKTOP_QUERY).matches) return 'desktop';
    return 'tablet';
  }

  private readCollapsed(): boolean {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  }
}
