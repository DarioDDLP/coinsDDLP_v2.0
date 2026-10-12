import { Observable } from 'rxjs';
import { Permission } from '../constants/permissions.const';
import { Translations } from './translations.interface';

type DbLiterals = Translations['admin']['db'];

/** Nombre de una tabla del diagrama (las claves de `admin.db.tables` en los JSON de idiomas). */
export type DbTableName = keyof DbLiterals['tables'];
export type DbProcessName = keyof DbLiterals['processes'];
export type DbGroup = keyof DbLiterals['groups'];
export type DbOperation = keyof DbLiterals['operations'];

/**
 * Quién puede hacer una operación según la RLS. `permission` lleva sus claves (el admin las tiene
 * todas); `self` = solo sus filas; `service` = solo las Edge Functions con la service_role.
 */
export type DbAccessLevel =
  | 'public'
  | 'authenticated'
  | 'self'
  | 'permission'
  | 'admin'
  | 'service'
  | 'none';

export interface DbAccessRule {
  level: DbAccessLevel;
  permissions?: Permission[];
}

export interface DbColumn {
  name: string;
  type: string;
  pk?: boolean;
  /** Tabla a la que apunta (la relación con su acción va en `DB_RELATIONS`). */
  fk?: DbTableName;
  nullable?: boolean;
  /** Se pinta en la tarjeta del diagrama (las PK y FK siempre). */
  inDiagram?: boolean;
}

export interface DbTable {
  name: DbTableName;
  /** Nombre real en la BD (`auth.users` para la de Supabase Auth). */
  sqlName: string;
  group: DbGroup;
  external?: boolean;
  columns: DbColumn[];
  access: Record<DbOperation, DbAccessRule[]>;
  /** Esquina superior izquierda en el diagrama (unidades del viewBox). */
  x: number;
  y: number;
}

export interface DbRelation {
  from: DbTableName;
  column: string;
  to: DbTableName;
  onDelete: 'cascade' | 'setNull' | 'restrict';
}

export interface DbProcess {
  name: DbProcessName;
  writes: DbTableName[];
}

export type DbTableCounts = Partial<Record<DbTableName, number>>;

export interface IDbOverviewRepository {
  getTableCounts(): Observable<DbTableCounts>;
}
