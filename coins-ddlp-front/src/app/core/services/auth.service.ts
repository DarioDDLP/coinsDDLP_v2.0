import { Injectable, inject, signal, computed } from '@angular/core';
import { IAuthService } from '../../shared/interfaces/auth-service.interface';
import { AppUser, UserRole } from '../../shared/interfaces/app-user.interface';
import { SUPABASE_CLIENT } from '../../app.config';
import { User } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class AuthService implements IAuthService {
  private supabase = inject(SUPABASE_CLIENT);
  readonly currentUser = signal<AppUser | null>(null);
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');

  constructor() {
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      this.currentUser.set(session?.user ? this.mapUser(session.user) : null);
    });

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.currentUser.set(session?.user ? this.mapUser(session.user) : null);
    });
  }

  private mapUser(user: User): AppUser {
    return {
      uid: user.id,
      email: user.email ?? null,
      displayName: user.user_metadata?.['full_name'] ?? null,
      role: (user.app_metadata?.['role'] as UserRole) ?? null,
    };
  }

  async login(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async logout(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }
}
