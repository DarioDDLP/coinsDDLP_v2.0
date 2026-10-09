import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { OwnerSlug } from '../../shared/interfaces/owner.interface';
import { AuthService } from './auth.service';
import { PermissionsService } from './permissions.service';

export const OWNER_IDS: Record<'dario' | 'manolo', string> = {
  dario: 'e787ff06-0da9-43e8-9dc5-a16e37cb4a33',
  manolo: 'a02324b5-c401-4dbd-938f-9aea5f8b43da',
};

const SESSION_KEY = 'owner_mode';

/** Slug de la colección propia del usuario, o `null` si no es dueño de ninguna. */
export function getOwnSlug(uid: string | null | undefined): 'dario' | 'manolo' | null {
  if (!uid) return null;
  return (
    (Object.keys(OWNER_IDS) as ('dario' | 'manolo')[]).find((k) => OWNER_IDS[k] === uid) ?? null
  );
}

@Injectable({ providedIn: 'root' })
export class OwnerService {
  private auth = inject(AuthService);
  private permissions = inject(PermissionsService);

  readonly current = signal<OwnerSlug>(
    (sessionStorage.getItem(SESSION_KEY) as OwnerSlug) ?? 'dario',
  );

  readonly primaryId = computed<string | null>(() => {
    const mode = this.current();
    return mode === 'both' ? null : OWNER_IDS[mode];
  });

  /** Colección propia del usuario con sesión (`null` si no es dueño). */
  readonly ownSlug = computed(() => getOwnSlug(this.auth.currentUser()?.uid));

  constructor() {
    // Sin permiso para cambiar de colección: su propia colección o, si no tiene, la de Darío
    effect(() => {
      if (!this.permissions.loaded() || this.permissions.can('collection.switch')) return;
      const fixed = this.ownSlug() ?? 'dario';
      if (untracked(this.current) !== fixed) this.setOwner(fixed);
    });
  }

  setOwner(slug: OwnerSlug): void {
    this.current.set(slug);
    sessionStorage.setItem(SESSION_KEY, slug);
  }
}
