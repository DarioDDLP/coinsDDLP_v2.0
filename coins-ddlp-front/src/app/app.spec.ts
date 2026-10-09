import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { TranslocoTestingModule } from '@jsverse/transloco';
import es from '../../public/i18n/es.json';
import { App } from './app';
import { SUPABASE_CLIENT } from './app.config';

/** Cliente de Supabase mínimo: sin sesión y sin suscripciones reales. */
const supabaseStub = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  // Permisos del Invitado (PermissionsService): ninguno
  from: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
};

/** jsdom no implementa matchMedia (lo usa LayoutStateService): simula escritorio. */
function stubMatchMedia(): void {
  window.matchMedia = (query: string) =>
    ({
      matches: query.includes('min-width'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList;
}

describe('App', () => {
  beforeEach(async () => {
    stubMatchMedia();
    await TestBed.configureTestingModule({
      imports: [
        App,
        TranslocoTestingModule.forRoot({
          langs: { es },
          translocoConfig: { availableLangs: ['es', 'en'], defaultLang: 'es' },
          preloadLangs: true,
        }),
      ],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        MessageService,
        { provide: SUPABASE_CLIENT, useValue: supabaseStub },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the shell with main content landmark', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('main#main')).toBeTruthy();
    expect(compiled.querySelector('.skip-link')).toBeTruthy();
  });
});
