import { AppUser } from '../shared/interfaces/app-user.interface';

/** Nombre visible del usuario: nombre completo, o la parte local del email. */
export function userDisplayName(user: AppUser | null): string {
  if (!user) return '';
  return user.displayName ?? user.email?.split('@')[0] ?? '';
}

/** Iniciales para el avatar (máximo 2 letras). */
export function userInitials(user: AppUser | null): string {
  const name = userDisplayName(user).trim();
  if (!name) return '?';
  const parts = name.split(/[\s._-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
  return letters.toUpperCase();
}
