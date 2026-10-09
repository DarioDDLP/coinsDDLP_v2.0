import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { permissionGuard } from './core/guards/permission.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'euros',
    pathMatch: 'full',
  },
  {
    path: 'euros',
    loadComponent: () => import('./features/euros/euros.component').then((m) => m.EurosComponent),
    loadChildren: () => import('./features/euros/euros.routes').then((m) => m.eurosRoutes),
  },
  {
    path: 'conmemorativas',
    canActivate: [permissionGuard('section.conmemorativas')],
    loadComponent: () =>
      import('./features/conmemorativas/conmemorativas.component').then(
        (m) => m.ConmemorativasComponent,
      ),
  },
  {
    path: 'pesetas',
    canActivate: [permissionGuard('section.pesetas')],
    loadComponent: () =>
      import('./features/pesetas/pesetas.component').then((m) => m.PesetasComponent),
    loadChildren: () => import('./features/pesetas/pesetas.routes').then((m) => m.pesetasRoutes),
  },
  {
    path: 'estadisticas',
    canActivate: [permissionGuard('section.estadisticas')],
    loadComponent: () =>
      import('./features/estadisticas/components/estadisticas-dashboard/estadisticas-dashboard.component').then(
        (m) => m.EstadisticasDashboardComponent,
      ),
  },
  {
    path: 'ubicacion',
    canActivate: [permissionGuard('section.ubicacion')],
    loadComponent: () =>
      import('./features/ubicacion/ubicacion.component').then((m) => m.UbicacionComponent),
    loadChildren: () =>
      import('./features/ubicacion/ubicacion.routes').then((m) => m.ubicacionRoutes),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/admin.component').then((m) => m.AdminComponent),
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoutes),
  },
  {
    path: 'herramientas',
    canActivate: [permissionGuard('tools.addEuro', 'tools.addYear')],
    loadComponent: () => import('./features/tools/tools.component').then((m) => m.ToolsComponent),
    loadChildren: () => import('./features/tools/tools.routes').then((m) => m.toolsRoutes),
  },
  {
    path: '**',
    redirectTo: 'euros',
  },
];
