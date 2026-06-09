import { Routes } from '@angular/router';

export const ubicacionRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/ubicacion-map/ubicacion-map.component').then(
        (m) => m.UbicacionMapComponent,
      ),
  },
];
