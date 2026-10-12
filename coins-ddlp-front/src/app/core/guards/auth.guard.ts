import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  // Al entrar por URL directa la sesión aún se está cargando
  await auth.ready;
  if (auth.isLoggedIn()) return true;
  return router.createUrlTree(['/euros']);
};
