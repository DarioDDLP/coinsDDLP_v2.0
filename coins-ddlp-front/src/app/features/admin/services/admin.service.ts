import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { from, Observable, switchMap } from 'rxjs';
import { AppUser } from '../../../shared/interfaces/app-user.interface';
import { SUPABASE_CLIENT } from '../../../app.config';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private supabase = inject(SUPABASE_CLIENT);
  private edgeFunctionUrl = `${environment.supabase.url}/functions/v1/admin-users`;

  getUsers(): Observable<AppUser[]> {
    return this.withAuth((headers) =>
      this.http.get<AppUser[]>(this.edgeFunctionUrl, { headers })
    );
  }

  createUser(email: string, password: string, displayName: string, role: string): Observable<AppUser> {
    return this.withAuth((headers) =>
      this.http.post<AppUser>(this.edgeFunctionUrl, { email, password, displayName, role }, { headers })
    );
  }

  updateUser(uid: string, displayName: string, role: string): Observable<AppUser> {
    return this.withAuth((headers) =>
      this.http.patch<AppUser>(`${this.edgeFunctionUrl}/${uid}`, { displayName, role }, { headers })
    );
  }

  deleteUser(uid: string): Observable<void> {
    return this.withAuth((headers) =>
      this.http.delete<void>(`${this.edgeFunctionUrl}/${uid}`, { headers })
    );
  }

  private withAuth<T>(fn: (headers: HttpHeaders) => Observable<T>): Observable<T> {
    return from(this.supabase.auth.getSession()).pipe(
      switchMap(({ data: { session } }) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${session?.access_token ?? ''}`,
        });
        return fn(headers);
      })
    );
  }
}
