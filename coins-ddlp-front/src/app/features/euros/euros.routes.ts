import { Routes } from '@angular/router';

export const eurosRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/euros-list/euros-list.component').then(
        (m) => m.EurosListComponent
      ),
  },
  {
    path: ':country',
    loadComponent: () =>
      import('./components/country-years/country-years.component').then(
        (m) => m.CountryYearsComponent
      ),
  },
  {
    path: ':country/:year',
    loadComponent: () =>
      import('./components/euros-detail/euros-detail.component').then(
        (m) => m.EurosDetailComponent
      ),
  },
  {
    path: ':country/:year/:id',
    loadComponent: () =>
      import('./components/coin-detail/coin-detail.component').then(
        (m) => m.CoinDetailComponent
      ),
  },
];
