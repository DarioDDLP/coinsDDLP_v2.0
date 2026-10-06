import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  InjectionToken,
  isDevMode,
  LOCALE_ID,
  provideAppInitializer,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import localeEn from '@angular/common/locales/en';
import { provideHttpClient } from '@angular/common/http';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MessageService } from 'primeng/api';
import { provideTransloco, TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { providePrimeNG } from 'primeng/config';
import { environment } from '../environments/environment';
import { GlobalErrorHandler } from './core/services/global-error-handler.service';
import { AppPreset, DARK_MODE_SELECTOR } from './core/theme/app-preset';
import { TranslocoHttpLoader } from './core/i18n/transloco-loader';
import { getInitialLang } from './core/i18n/initial-lang';
import { AVAILABLE_LANGS, DEFAULT_LANG } from './shared/constants/i18n.const';

registerLocaleData(localeEs);
registerLocaleData(localeEn);

const initialLang = getInitialLang();

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
    provideTransloco({
      config: {
        availableLangs: AVAILABLE_LANGS,
        defaultLang: initialLang,
        fallbackLang: DEFAULT_LANG,
        missingHandler: { useFallbackTranslation: true },
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    // Diccionario cargado antes del primer pintado: nunca se ven claves sueltas
    provideAppInitializer(() => firstValueFrom(inject(TranslocoService).load(initialLang))),
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
