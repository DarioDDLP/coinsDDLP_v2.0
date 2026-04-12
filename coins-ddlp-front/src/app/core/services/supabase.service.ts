import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { Observable } from 'rxjs';
import { SUPABASE_CLIENT } from '../../app.config';
import { TableName } from '../../shared/constants/collections.const';
import { LoadingService } from './loading.service';

/**
 * Servicio genérico de acceso a Supabase PostgreSQL.
 * Responsabilidad única: comunicación con la base de datos.
 * No contiene lógica de negocio.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase = inject(SUPABASE_CLIENT);
  private loading = inject(LoadingService);

  getTable<T extends { id: string }>(tableName: TableName): Observable<T[]> {
    return new Observable(observer => {
      // Cargar todos los datos con paginación
      const loadAllData = async () => {
        this.loading.showLoading();

        try {
          let allData: T[] = [];
          let offset = 0;
          const pageSize = 1000;
          let hasMore = true;

          while (hasMore) {
            const { data, error } = await this.supabase
              .from(tableName)
              .select('*')
              .range(offset, offset + pageSize - 1);

            if (error) {
              observer.error(error);
              return;
            }

            if (!data || data.length === 0) {
              hasMore = false;
            } else {
              allData = [...allData, ...(data as T[])];
              offset += pageSize;
            }
          }

          observer.next(allData);
        } finally {
          this.loading.hideLoading();
        }
      };

      loadAllData();

      // Suscribirse a cambios en tiempo real
      const channel = this.supabase
        .channel(`${tableName}-changes`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: tableName,
          },
          () => {
            // Cuando hay cambios, recargar todos los datos
            loadAllData();
          }
        )
        .subscribe();

      // Cleanup: desuscribirse cuando se complete
      return () => {
        channel.unsubscribe();
      };
    });
  }

  async add<T extends object>(
    tableName: TableName,
    data: T
  ): Promise<string> {
    const { data: insertedData, error } = await this.supabase
      .from(tableName)
      .insert([data])
      .select('id');

    if (error) throw error;
    return insertedData?.[0]?.id as string;
  }

  async update<T extends object>(
    tableName: TableName,
    id: string,
    data: Partial<T>
  ): Promise<void> {
    const { error } = await this.supabase
      .from(tableName)
      .update(data as T)
      .eq('id', id);

    if (error) throw error;
  }

  async remove(tableName: TableName, id: string): Promise<void> {
    const { error } = await this.supabase
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
