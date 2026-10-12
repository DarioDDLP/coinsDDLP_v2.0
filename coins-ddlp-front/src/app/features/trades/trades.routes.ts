import { Routes } from '@angular/router';

export const tradesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/trades-page/trades-page.component').then((m) => m.TradesPageComponent),
  },
];
