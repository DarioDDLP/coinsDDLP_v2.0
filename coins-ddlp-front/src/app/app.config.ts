import { ApplicationConfig, ErrorHandler, InjectionToken, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MessageService } from 'primeng/api';

import { routes } from './app.routes';
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

const AppPreset = definePreset(Aura, {
  components: {
    select: {
      root: {
        borderColor: '#2d3a7a',
        hoverBorderColor: '#2d3a7a',
        focusBorderColor: '#d9b582',
        borderRadius: '8px',
        paddingX: '14px',
        paddingY: '10px',
        color: '#151465',
        focusRing: {
          width: '0',
          style: 'none',
          shadow: '0 0 0 3px rgba(217, 181, 130, 0.15)',
        },
      },
      option: {
        color: '#151465',
        focusBackground: '#fff5e8',
        focusColor: '#151465',
        selectedBackground: '#2d3a7a',
        selectedColor: '#ffffff',
        selectedFocusBackground: '#151465',
        selectedFocusColor: '#ffffff',
      },
      overlay: {
        borderColor: '#2d3a7a',
        borderRadius: '8px',
      },
    },
  },
});
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
        preset: AppPreset,
        options: { darkModeSelector: false },
      },
    }),
    {
      provide: SUPABASE_CLIENT,
      useFactory: () => createClient(environment.supabase.url, environment.supabase.anonKey),
    },
  ],
};
