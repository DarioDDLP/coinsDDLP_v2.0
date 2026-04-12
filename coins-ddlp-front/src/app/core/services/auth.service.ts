import { Injectable, inject, signal } from '@angular/core';
import { IAuthService } from '../../shared/interfaces/auth-service.interface';
import { AppUser } from '../../shared/interfaces/app-user.interface';
import { SUPABASE_CLIENT } from '../../app.config';

@Injectable({ providedIn: 'root' })
export class AuthService implements IAuthService {
  private supabase = inject(SUPABASE_CLIENT);
  readonly currentUser = signal<AppUser | null>(null);

  constructor() {
    // Cargar usuario actual al iniciar
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        this.currentUser.set({
          uid: session.user.id,
          email: session.user.email ?? null,
        });
      }
    });

    // Escuchar cambios de autenticación
    this.supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        this.currentUser.set({
          uid: session.user.id,
          email: session.user.email ?? null,
        });
      } else {
        this.currentUser.set(null);
      }
    });
  }

  async login(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }

  async logout(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }
}
