export type UserRole = 'admin';

export interface AppUser {
  uid: string;
  email: string | null;
  role: UserRole | null;
}
