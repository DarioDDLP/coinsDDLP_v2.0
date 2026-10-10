import { Injectable, inject, signal, computed } from '@angular/core';
import { IAuthService } from '../../shared/interfaces/auth-service.interface';
import { AppUser, UserRole } from '../../shared/interfaces/app-user.interface';
import { SUPABASE_CLIENT } from '../../app.config';
import { User } from '@supabase/supabase-js';
import { AccessLogService } from './access-log.service';

@Injectable({ providedIn: 'root' })
export class AuthService implements IAuthService {
  private supabase = inject(SUPABASE_CLIENT);
  private accessLog = inject(AccessLogService);
  readonly currentUser = signal<AppUser | null>(null);
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');
  readonly isRecoveryMode = signal(false);
  /** Se resuelve al conocer la sesión inicial (los guards esperan a esto). */
  readonly ready: Promise<void>;

  constructor() {
    this.ready = this.supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        this.currentUser.set(session?.user ? this.mapUser(session.user) : null);
      })
      .catch(() => undefined);

    this.supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        this.isRecoveryMode.set(true);
      } else {
        this.currentUser.set(session?.user ? this.mapUser(session.user) : null);
      }
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
    if (error) {
      void this.accessLog.track('login_failed', { detail: email });
      throw error;
    }
    void this.accessLog.track('login');
  }

  async logout(): Promise<void> {
    // Antes de cerrar la sesión: el evento todavía lleva el token del usuario
    await this.accessLog.track('logout');
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  async resetPassword(email: string): Promise<void> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }

  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await this.supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    this.isRecoveryMode.set(false);
  }
}
