import { Injectable, computed, signal } from '@angular/core';
import { OwnerSlug } from '../../shared/interfaces/owner.interface';

export const OWNER_IDS: Record<'dario' | 'manolo', string> = {
  dario: 'e787ff06-0da9-43e8-9dc5-a16e37cb4a33',
  manolo: 'a02324b5-c401-4dbd-938f-9aea5f8b43da',
};

const SESSION_KEY = 'owner_mode';

@Injectable({ providedIn: 'root' })
export class OwnerService {
  readonly current = signal<OwnerSlug>(
    (sessionStorage.getItem(SESSION_KEY) as OwnerSlug) ?? 'dario',
  );

  readonly primaryId = computed<string | null>(() => {
    const mode = this.current();
    return mode === 'ambas' ? null : OWNER_IDS[mode];
  });

  setOwner(slug: OwnerSlug): void {
    this.current.set(slug);
    sessionStorage.setItem(SESSION_KEY, slug);
  }
}
