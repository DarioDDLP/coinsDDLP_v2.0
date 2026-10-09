import { computed, effect, inject, Injectable, Signal, signal, untracked } from '@angular/core';
import { SUPABASE_CLIENT } from '../../app.config';
import { AuthService } from './auth.service';
import { TABLES } from '../../shared/constants/collections.const';
import { Permission, PERMISSIONS } from '../../shared/constants/permissions.const';
import { IPermissionsService } from '../../shared/interfaces/permissions-service.interface';

const ALL_PERMISSIONS: ReadonlySet<Permission> = new Set(PERMISSIONS);
const VALID = (p: string): p is Permission => ALL_PERMISSIONS.has(p as Permission);

/**
 * Permisos efectivos del usuario actual. Los del perfil Invitado se cargan al
 * arrancar y los del usuario cada vez que cambia la sesión. Si una carga falla
 * se queda sin esos permisos (la BD los vuelve a comprobar en cada escritura).
 */
@Injectable({ providedIn: 'root' })
export class PermissionsService implements IPermissionsService {
  private supabase = inject(SUPABASE_CLIENT);
  private auth = inject(AuthService);

  private readonly guest = signal<ReadonlySet<Permission>>(new Set());
  private readonly own = signal<ReadonlySet<Permission>>(new Set());
  private loadId = 0;
  /** Carga de permisos propios más reciente (`ready` espera a la última). */
  private latestOwnLoad: Promise<void> = Promise.resolve();

  readonly granted = computed<ReadonlySet<Permission>>(() =>
    this.auth.isAdmin() ? ALL_PERMISSIONS : new Set([...this.guest(), ...this.own()]),
  );

  readonly ready: Promise<void>;
  /** `true` cuando `ready` se ha resuelto (para efectos que no deben actuar antes). */
  readonly loaded = signal(false);

  constructor() {
    this.ready = Promise.all([this.auth.ready, this.loadGuest()])
      .then(() => this.loadOwn(this.auth.currentUser()?.uid ?? null))
      .then(() => this.latestOwnLoad)
      .then(() => this.loaded.set(true));

    // Recarga los permisos propios al iniciar o cerrar sesión
    effect(() => {
      const uid = this.auth.currentUser()?.uid ?? null;
      untracked(() => void this.loadOwn(uid));
    });
  }

  can(permission: Permission): boolean {
    return this.granted().has(permission);
  }

  async reload(): Promise<void> {
    await Promise.all([this.loadGuest(), this.loadOwn(this.auth.currentUser()?.uid ?? null)]);
  }

  private async loadGuest(): Promise<void> {
    const { data, error } = await this.supabase.from(TABLES.guestPermission).select('permission');
    if (error) return;
    this.guest.set(new Set((data ?? []).map((r) => r.permission as string).filter(VALID)));
  }

  private loadOwn(uid: string | null): Promise<void> {
    const id = ++this.loadId;
    this.latestOwnLoad = this.fetchOwn(uid, id);
    return this.latestOwnLoad;
  }

  private async fetchOwn(uid: string | null, id: number): Promise<void> {
    if (!uid) {
      this.own.set(new Set());
      return;
    }
    const { data, error } = await this.supabase
      .from(TABLES.userPermission)
      .select('permission')
      .eq('userId', uid);
    // Una respuesta antigua no pisa la de una sesión más reciente
    if (id !== this.loadId) return;
    this.own.set(
      error ? new Set() : new Set((data ?? []).map((r) => r.permission as string).filter(VALID)),
    );
  }
}

/** `true` si el usuario actual tiene alguno de los permisos. Llamar en un contexto de inyección. */
export function injectCan(...permissions: Permission[]): Signal<boolean> {
  const service = inject(PermissionsService);
  return computed(() => permissions.some((p) => service.granted().has(p)));
}
