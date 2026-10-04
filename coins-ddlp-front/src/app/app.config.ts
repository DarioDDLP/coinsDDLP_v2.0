import { ApplicationConfig, ErrorHandler, InjectionToken, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { provideHttpClient } from '@angular/common/http';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MessageService } from 'primeng/api';

import { routes } from './app.routes';
import { providePrimeNG } from 'primeng/config';
import { environment } from '../environments/environment';
import { GlobalErrorHandler } from './core/services/global-error-handler.service';
import { AppPreset, DARK_MODE_SELECTOR } from './core/theme/app-preset';

registerLocaleData(localeEs);

export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient>('supabase-client');

export const appConfig: ApplicationConfig = {
  providers: [
    // Sin provideBrowserGlobalErrorListeners(): reenviaría al toast los errores de scripts
    // ajenos (extensiones, carteras como la de Brave con window.ethereum)
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    MessageService,
    { provide: LOCALE_ID, useValue: 'es' },
    provideRouter(routes),
    provideHttpClient(),
    providePrimeNG({
      license: environment.primeuiLicense,
      theme: {
        preset: AppPreset,
        options: { darkModeSelector: DARK_MODE_SELECTOR },
      },
    }),
    {
      provide: SUPABASE_CLIENT,
      useFactory: () => createClient(environment.supabase.url, environment.supabase.anonKey),
    },
  ],
};
