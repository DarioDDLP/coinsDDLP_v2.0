import { Routes } from '@angular/router';

export const toolsRoutes: Routes = [
  {
    path: '',
    redirectTo: 'añadir-euro',
    pathMatch: 'full',
  },
  {
    path: 'añadir-euro',
    loadComponent: () =>
      import('./components/tools-add-euro/tools-add-euro.component').then(
        (m) => m.ToolsAddEuroComponent
      ),
  },
];
