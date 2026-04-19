import { Routes } from '@angular/router';

export const eurosRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/euros-countries/euros-countries.component').then(
        (m) => m.EurosCountriesComponent
      ),
  },
  {
    path: ':country',
    loadComponent: () =>
      import('./components/euros-years/euros-years.component').then(
        (m) => m.EurosYearsComponent
      ),
  },
  {
    path: ':country/all',
    loadComponent: () =>
      import('./components/euros-all-coins/euros-all-coins.component').then(
        (m) => m.EurosAllCoinsComponent
      ),
  },
  {
    path: ':country/:year',
    loadComponent: () =>
      import('./components/euros-year-coins/euros-year-coins.component').then(
        (m) => m.EurosYearCoinsComponent
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
