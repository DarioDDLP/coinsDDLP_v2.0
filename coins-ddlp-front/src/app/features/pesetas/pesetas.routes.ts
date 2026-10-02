import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';

/**
 * /pesetas?valor=5 pesetas     → vista única con chips de denominación (valor opcional)
 * /pesetas/moneda/:id          → la misma vista con el detalle abierto en panel lateral
 *
 * Las URLs del diseño anterior (/all, /:faceValue, /:faceValue/:id) redirigen a las nuevas.
 */
export const pesetasRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/pesetas-browser/pesetas-browser.component').then(
        (m) => m.PesetasBrowserComponent,
      ),
    children: [
      { path: '', children: [] },
      {
        path: 'moneda/:id',
        loadComponent: () =>
          import('./components/peseta-detail-drawer/peseta-detail-drawer.component').then(
            (m) => m.PesetaDetailDrawerComponent,
          ),
      },
    ],
  },
  // --- Redirecciones de las rutas antiguas ---
  {
    path: 'all',
    redirectTo: () => inject(Router).createUrlTree(['/pesetas']),
  },
  {
    path: ':faceValue/:id',
    redirectTo: ({ params }) =>
      inject(Router).createUrlTree(['/pesetas', 'moneda', params['id']], {
        queryParams: { valor: params['faceValue'] },
      }),
  },
  {
    path: ':faceValue',
    redirectTo: ({ params }) =>
      inject(Router).createUrlTree(['/pesetas'], { queryParams: { valor: params['faceValue'] } }),
  },
];
