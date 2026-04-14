import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NumistaCoin } from '../../shared/interfaces/numista-coin.interface';

@Injectable({ providedIn: 'root' })
export class NumistaService {
  private http = inject(HttpClient);

  getCoinByIdNum(idNum: string): Observable<NumistaCoin> {
    return this.http.get<NumistaCoin>(
      `${environment.supabase.url}/functions/v1/numista-proxy?idNum=${idNum}`
    );
  }
}
