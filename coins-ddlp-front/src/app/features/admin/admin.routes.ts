import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    redirectTo: 'usuarios',
    pathMatch: 'full',
  },
  {
    path: 'usuarios',
    loadComponent: () =>
      import('./components/admin-users/admin-users.component').then(
        (m) => m.AdminUsersComponent
      ),
  },
];
