import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';
import { PermissionsService } from '../../core/services/permissions.service';

/** `/herramientas` abre la primera pestaña que el usuario puede usar. */
const toolsHomeGuard: CanActivateFn = async () => {
  const permissions = inject(PermissionsService);
  const router = inject(Router);
  await permissions.ready;
  return router.createUrlTree([
    permissions.can('tools.addEuro') ? '/herramientas/añadir-euro' : '/herramientas/añadir-año',
  ]);
};

export const toolsRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [toolsHomeGuard],
    children: [],
  },
  {
    path: 'añadir-euro',
    canActivate: [permissionGuard('tools.addEuro')],
    loadComponent: () =>
      import('./components/tools-add-euro/tools-add-euro.component').then(
        (m) => m.ToolsAddEuroComponent,
      ),
  },
  {
    path: 'añadir-año',
    canActivate: [permissionGuard('tools.addYear')],
    loadComponent: () =>
      import('./components/tools-add-year/tools-add-year.component').then(
        (m) => m.ToolsAddYearComponent,
      ),
  },
];
