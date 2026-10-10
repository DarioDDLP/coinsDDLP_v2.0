import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { from, map, Observable, switchMap } from 'rxjs';
import { AppUser, UserCollectionSettings } from '../../../shared/interfaces/app-user.interface';
import { Permission } from '../../../shared/constants/permissions.const';
import { SUPABASE_CLIENT } from '../../../app.config';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private supabase = inject(SUPABASE_CLIENT);
  private edgeFunctionUrl = `${environment.supabase.url}/functions/v1/admin-users`;

  getUsers(): Observable<AppUser[]> {
    return this.withAuth((headers) => this.http.get<AppUser[]>(this.edgeFunctionUrl, { headers }));
  }

  createUser(
    email: string,
    password: string,
    displayName: string,
    role: string,
    permissions: Permission[],
    collection: UserCollectionSettings,
  ): Observable<AppUser> {
    return this.withAuth((headers) =>
      this.http.post<AppUser>(
        this.edgeFunctionUrl,
        { email, password, displayName, role, permissions, ...collection },
        { headers },
      ),
    );
  }

  updateUser(
    uid: string,
    displayName: string,
    role: string,
    permissions: Permission[],
    collection: UserCollectionSettings,
  ): Observable<AppUser> {
    return this.withAuth((headers) =>
      this.http.patch<AppUser>(
        `${this.edgeFunctionUrl}/${uid}`,
        { displayName, role, permissions, ...collection },
        { headers },
      ),
    );
  }

  deleteUser(uid: string): Observable<void> {
    return this.withAuth((headers) =>
      this.http.delete<void>(`${this.edgeFunctionUrl}/${uid}`, { headers }),
    );
  }

  getGuestPermissions(): Observable<Permission[]> {
    return this.withAuth((headers) =>
      this.http
        .get<{ permissions: Permission[] }>(`${this.edgeFunctionUrl}/guest`, { headers })
        .pipe(map((r) => r.permissions)),
    );
  }

  updateGuestPermissions(permissions: Permission[]): Observable<Permission[]> {
    return this.withAuth((headers) =>
      this.http
        .put<{
          permissions: Permission[];
        }>(`${this.edgeFunctionUrl}/guest`, { permissions }, { headers })
        .pipe(map((r) => r.permissions)),
    );
  }

  /** Envía al usuario el email de recuperación de contraseña de Supabase. */
  sendRecoveryEmail(uid: string): Observable<void> {
    return this.withAuth((headers) =>
      this.http.post<void>(
        `${this.edgeFunctionUrl}/${uid}/recovery`,
        { redirectTo: window.location.origin },
        { headers },
      ),
    );
  }

  private withAuth<T>(fn: (headers: HttpHeaders) => Observable<T>): Observable<T> {
    return from(this.supabase.auth.getSession()).pipe(
      switchMap(({ data: { session } }) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${session?.access_token ?? ''}`,
        });
        return fn(headers);
      }),
    );
  }
}
