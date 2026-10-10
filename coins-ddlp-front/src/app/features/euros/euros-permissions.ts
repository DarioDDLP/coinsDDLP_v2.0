import { computed, inject, Signal } from '@angular/core';
import { OwnerService } from '../../core/services/owner.service';
import { injectCan } from '../../core/services/permissions.service';

/**
 * Puede editar unidades en la colección que se está viendo: con `euros.units.editAny`
 * siempre; con `euros.units.editOwn` solo viendo su propia colección (nunca al
 * comparar). Llamar en un contexto de inyección.
 */
export function injectCanEditUnits(): Signal<boolean> {
  const owner = inject(OwnerService);
  const editAny = injectCan('euros.units.editAny');
  const editOwn = injectCan('euros.units.editOwn');
  return computed(() => {
    if (editAny()) return true;
    if (!editOwn()) return false;
    const own = owner.ownId();
    return own !== null && !owner.isComparing() && owner.primaryId() === own;
  });
}

/** Puede abrir el diálogo de edición: unidades o datos de catálogo. */
export function injectCanEditCoins(): Signal<boolean> {
  const units = injectCanEditUnits();
  const catalog = injectCan('euros.catalog.edit');
  return computed(() => units() || catalog());
}
