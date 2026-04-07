import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { initializeApp } from 'firebase/app';

import { routes } from './app.routes';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';

const firebaseConfig = {
  apiKey: 'AIzaSyB-1dCHmVmJSb4IiR3GPN5ys5l4YT4RlWU',
  authDomain: 'coinsddlp-back.firebaseapp.com',
  projectId: 'coinsddlp-back',
  storageBucket: 'coinsddlp-back.appspot.com',
  messagingSenderId: '684451770045',
  appId: '1:684451770045:web:5bb64e0ead08b97f2c91d4',
};

initializeApp(firebaseConfig);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: { darkModeSelector: false },
      },
    }),
  ],
};
