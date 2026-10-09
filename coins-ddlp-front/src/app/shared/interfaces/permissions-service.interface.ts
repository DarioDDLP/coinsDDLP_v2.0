import { Signal } from '@angular/core';
import { Permission } from '../constants/permissions.const';

export interface IPermissionsService {
  /** Permisos efectivos: todos si es admin; si no, Invitado ∪ los del usuario. */
  granted: Signal<ReadonlySet<Permission>>;
  /** Se resuelve cuando la sesión y los permisos iniciales están cargados. */
  ready: Promise<void>;
  loaded: Signal<boolean>;
  can(permission: Permission): boolean;
  reload(): Promise<void>;
}
