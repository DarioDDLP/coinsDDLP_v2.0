import { Signal } from '@angular/core';
import { AppUser } from './app-user.interface';

export interface IAuthService {
  currentUser: Signal<AppUser | null>;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
}
