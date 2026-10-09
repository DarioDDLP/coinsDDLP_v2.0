import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionsService } from '../services/permissions.service';
import { Permission } from '../../shared/constants/permissions.const';

/** Deja pasar si el usuario tiene alguno de los permisos; si no, vuelve a `/euros`. */
export const permissionGuard =
  (...permissions: Permission[]): CanActivateFn =>
  async () => {
    const service = inject(PermissionsService);
    const router = inject(Router);
    await service.ready;
    return permissions.some((p) => service.can(p)) ? true : router.createUrlTree(['/euros']);
  };
