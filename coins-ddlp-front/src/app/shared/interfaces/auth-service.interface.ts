import { Signal } from '@angular/core';
import { AppUser } from './app-user.interface';

export interface IAuthService {
  currentUser: Signal<AppUser | null>;
  isLoggedIn: Signal<boolean>;
  isAdmin: Signal<boolean>;
  isRecoveryMode: Signal<boolean>;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  updatePassword(newPassword: string): Promise<void>;
}
