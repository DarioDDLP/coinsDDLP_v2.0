import { computed, inject, Signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { OwnerService, OWNER_IDS } from '../../core/services/owner.service';

/**
 * Puede editar unidades: el admin siempre; un usuario solo cuando está viendo su
 * propia colección (nunca en modo "ambas"). Llamar en un contexto de inyección.
 */
export function injectCanEditCoins(): Signal<boolean> {
  const auth = inject(AuthService);
  const owner = inject(OwnerService);
  return computed(() => {
    if (auth.isAdmin()) return true;
    if (!auth.isLoggedIn()) return false;
    const mode = owner.current();
    if (mode === 'both') return false;
    return auth.currentUser()?.uid === OWNER_IDS[mode];
  });
}

/** Una moneda cuenta como "tengo" con unidades; en modo ambas, si la tienen los dos. */
export function isOwned(uds: number, udsAlt: number | undefined, both: boolean): boolean {
  return both ? uds > 0 && (udsAlt ?? 0) > 0 : uds > 0;
}
