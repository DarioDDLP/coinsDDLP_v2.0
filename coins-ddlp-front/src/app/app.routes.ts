import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'euros',
    pathMatch: 'full',
  },
  {
    path: 'euros',
    loadComponent: () =>
      import('./features/euros/components/euros-list/euros-list.component').then(
        (m) => m.EurosListComponent
      ),
  },
  {
    path: 'euros/:country/:year',
    loadComponent: () =>
      import('./features/euros/components/euros-detail/euros-detail.component').then(
        (m) => m.EurosDetailComponent
      ),
  },
  {
    path: 'euros/:country',
    loadComponent: () =>
      import('./features/euros/components/country-years/country-years.component').then(
        (m) => m.CountryYearsComponent
      ),
  },
  {
    path: 'conmemorativas',
    loadComponent: () =>
      import(
        './features/conmemorativas/components/conmemorativas-list/conmemorativas-list.component'
      ).then((m) => m.ConmemorativasListComponent),
  },
  {
    path: 'pesetas',
    loadComponent: () =>
      import('./features/pesetas/components/pesetas-list/pesetas-list.component').then(
        (m) => m.PesetasListComponent
      ),
  },
  {
    path: 'estadisticas',
    loadComponent: () =>
      import(
        './features/estadisticas/components/estadisticas-dashboard/estadisticas-dashboard.component'
      ).then((m) => m.EstadisticasDashboardComponent),
  },
  {
    path: 'ubicacion',
    loadComponent: () =>
      import('./features/ubicacion/components/ubicacion-map/ubicacion-map.component').then(
        (m) => m.UbicacionMapComponent
      ),
  },
  {
    path: '**',
    redirectTo: 'euros',
  },
];
