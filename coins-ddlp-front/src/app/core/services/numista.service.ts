import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NumistaCoin } from '../../shared/interfaces/numista-coin.interface';

@Injectable({ providedIn: 'root' })
export class NumistaService {
  private http = inject(HttpClient);

  readonly remaining = signal<number | null>(null);

  getCoinByIdNum(idNum: string): Observable<NumistaCoin> {
    return this.http.get<NumistaCoin>(
      `${environment.supabase.url}/functions/v1/numista-proxy?idNum=${idNum}`,
      { observe: 'response' }
    ).pipe(
      tap(response => {
        const remaining = response.headers.get('X-Numista-Remaining');
        if (remaining !== null) this.remaining.set(+remaining);
      }),
      map(response => response.body!)
    );
  }
}
