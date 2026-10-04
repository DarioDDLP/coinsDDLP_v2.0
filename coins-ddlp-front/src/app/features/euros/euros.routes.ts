import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';

/**
 * /euros                        → cuadrícula de países
 * /euros/:country?year=2005     → vista de país (año opcional)
 * /euros/:country/moneda/:id    → vista de país con el detalle abierto en panel lateral
 *
 * Las URLs del diseño anterior (/:country/all, /:country/:year, /:country/:year/:id)
 * redirigen a las nuevas para no romper enlaces guardados.
 */
export const eurosRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/euros-countries/euros-countries.component').then(
        (m) => m.EurosCountriesComponent,
      ),
  },
  {
    path: ':country',
    loadComponent: () =>
      import('./components/euros-country/euros-country.component').then(
        (m) => m.EurosCountryComponent,
      ),
    children: [
      { path: '', children: [] },
      {
        path: 'moneda/:id',
        loadComponent: () =>
          import('./components/coin-detail-drawer/coin-detail-drawer.component').then(
            (m) => m.CoinDetailDrawerComponent,
          ),
      },
    ],
  },
  // --- Redirecciones de las rutas antiguas ---
  {
    path: ':country/all',
    redirectTo: ({ params }) => inject(Router).createUrlTree(['/euros', params['country']]),
  },
  {
    path: ':country/:year',
    redirectTo: ({ params }) =>
      inject(Router).createUrlTree(['/euros', params['country']], {
        queryParams: { year: params['year'] },
      }),
  },
  {
    path: ':country/:year/:id',
    redirectTo: ({ params, queryParams }) =>
      inject(Router).createUrlTree(['/euros', params['country'], 'moneda', params['id']], {
        queryParams: {
          ...queryParams,
          ...(params['year'] !== 'all' ? { year: params['year'] } : {}),
        },
      }),
  },
];
