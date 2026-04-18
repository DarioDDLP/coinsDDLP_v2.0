import { ApplicationConfig, ErrorHandler, InjectionToken, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MessageService } from 'primeng/api';

import { routes } from './app.routes';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { environment } from '../environments/environment';
import { GlobalErrorHandler } from './core/services/global-error-handler.service';

export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient>('supabase-client');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    MessageService,
    provideRouter(routes),
    provideHttpClient(),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: { darkModeSelector: false },
      },
    }),
    {
      provide: SUPABASE_CLIENT,
      useFactory: () => createClient(environment.supabase.url, environment.supabase.anonKey),
    },
  ],
};
