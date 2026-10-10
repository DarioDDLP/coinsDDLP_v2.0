import { Permission } from '../constants/permissions.const';

export type UserRole = 'admin' | 'user';

/** Colección de euros propia de un usuario (solo en la gestión de usuarios). */
export interface UserCollection {
  isDefault: boolean;
  /** Monedas con unidades guardadas (para avisar antes de quitarla). */
  units: number;
}

/** Lo que el admin decide sobre la colección al crear o editar un usuario. */
export interface UserCollectionSettings {
  hasCollection: boolean;
  isDefaultCollection: boolean;
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole | null;
  /** Solo en la gestión de usuarios (Edge Function `admin-users`). */
  permissions?: Permission[];
  /** Solo en la gestión de usuarios: su colección, o `null` si no tiene. */
  collection?: UserCollection | null;
}
