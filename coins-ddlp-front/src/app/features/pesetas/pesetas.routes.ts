import { Routes } from '@angular/router';

export const pesetasRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/pesetas-denominations/pesetas-denominations.component').then(
        (m) => m.PesetasDenominationsComponent
      ),
  },
  {
    path: 'all',
    loadComponent: () =>
      import('./components/pesetas-all/pesetas-all.component').then(
        (m) => m.PesetasAllComponent
      ),
  },
  {
    path: ':faceValue/:id',
    loadComponent: () =>
      import('./components/peseta-detail/peseta-detail.component').then(
        (m) => m.PesetaDetailComponent
      ),
  },
  {
    path: ':faceValue',
    loadComponent: () =>
      import('./components/pesetas-list/pesetas-list.component').then(
        (m) => m.PesetasListComponent
      ),
  },
];
