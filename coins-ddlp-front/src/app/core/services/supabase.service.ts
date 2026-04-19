import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { Observable } from 'rxjs';
import { SUPABASE_CLIENT } from '../../app.config';
import { TableName } from '../../shared/constants/collections.const';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase = inject(SUPABASE_CLIENT);

  getTable<T extends { id: string }>(tableName: TableName): Observable<T[]> {
    return this.getTableWhere<T>(tableName, (query) => query);
  }

  getTableWhere<T>(
    tableName: TableName,
    filterFn: (query: any) => any,
    fields = '*'
  ): Observable<T[]> {
    return new Observable(observer => {
      const loadAllData = async () => {
        try {
          let allData: T[] = [];
          let offset = 0;
          const pageSize = 1000;
          let hasMore = true;

          while (hasMore) {
            const baseQuery = this.supabase.from(tableName).select(fields);
            const { data, error } = await filterFn(baseQuery).order('id', { ascending: true }).range(offset, offset + pageSize - 1);

            if (error) {
              observer.error(error);
              return;
            }

            if (!data || data.length === 0) {
              hasMore = false;
            } else {
              allData = [...allData, ...(data as T[])];
              offset += pageSize;
              if (data.length < pageSize) {
                hasMore = false;
              }
            }
          }

          observer.next(allData);
          observer.complete();
        } catch (error) {
          observer.error(error);
        }
      };

      loadAllData();
      return () => {};
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
