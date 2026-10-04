import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';
import {
  CountryLocation,
  NewCountryLocation,
} from '../../../shared/interfaces/country-location.interface';
import { TABLES } from '../../../shared/constants/collections.const';

@Injectable({ providedIn: 'root' })
export class UbicacionService {
  private supabase = inject(SupabaseService);

  getAll(): Observable<CountryLocation[]> {
    return this.supabase.getTableWhere<CountryLocation>(TABLES.countryLocation, (query) =>
      query.order('album', { ascending: true }).order('country', { ascending: true }),
    );
  }

  getCountries(): Observable<string[]> {
    return this.supabase
      .getTableWhere<{ country: string }>(TABLES.euro, (q) => q, 'country')
      .pipe(map((rows) => [...new Set(rows.map((r) => r.country))].sort()));
  }

  async add(data: NewCountryLocation): Promise<string> {
    return this.supabase.add(TABLES.countryLocation, data);
  }

  async update(id: string, data: Partial<NewCountryLocation>): Promise<void> {
    return this.supabase.update(TABLES.countryLocation, id, data);
  }

  async remove(id: string): Promise<void> {
    return this.supabase.remove(TABLES.countryLocation, id);
  }
}
