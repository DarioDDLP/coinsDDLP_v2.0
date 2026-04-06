import { Injectable, signal } from '@angular/core';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { IAuthService } from '../../shared/interfaces/auth-service.interface';
import { AppUser } from '../../shared/interfaces/app-user.interface';

@Injectable({ providedIn: 'root' })
export class AuthService implements IAuthService {
  readonly currentUser = signal<AppUser | null>(null);

  private get auth() {
    return getAuth();
  }

  constructor() {
    onAuthStateChanged(this.auth, firebaseUser => {
      this.currentUser.set(
        firebaseUser
          ? { uid: firebaseUser.uid, email: firebaseUser.email }
          : null
      );
    });
  }

  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }
}
