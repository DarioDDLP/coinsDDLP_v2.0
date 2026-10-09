import { Permission } from '../constants/permissions.const';

export type UserRole = 'admin' | 'user';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole | null;
  /** Solo en la gestión de usuarios (Edge Function `admin-users`). */
  permissions?: Permission[];
}
