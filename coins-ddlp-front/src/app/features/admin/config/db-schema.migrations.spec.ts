import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DB_TABLES } from './db-schema.config';

/**
 * Vigila que el mapa de Admin → Base de datos siga a las migraciones: si una migración crea una
 * tabla y no se añade a `db-schema.config.ts` (ni a `db_table_counts()`), este test falla.
 * No detecta columnas nuevas ni cambios de RLS: eso lo recuerda la regla de CLAUDE.md.
 */

// `ng test` corre desde coins-ddlp-front/
const MIGRATIONS_DIR = resolve(process.cwd(), '../supabase/migrations');

const migrations = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((file) => ({ file, sql: readFileSync(resolve(MIGRATIONS_DIR, file), 'utf-8') }));

/** Tablas de `public` creadas en las migraciones (sin las que se borran después). */
function migratedTables(): Set<string> {
  const tables = new Set<string>();
  const statement =
    /\b(create|drop)\s+table\s+(?:if\s+(?:not\s+)?exists\s+)?(?:public\.)?"?(\w+)"?/gi;
  for (const { sql } of migrations) {
    for (const [, action, name] of sql.matchAll(statement)) {
      if (action.toLowerCase() === 'create') tables.add(name);
      else tables.delete(name);
    }
  }
  return tables;
}

/** Nombres que devuelve la última versión de `db_table_counts()`. */
function countedTables(): string[] {
  const last = migrations
    .filter(({ sql }) => /function\s+public\.db_table_counts\b/i.test(sql))
    .pop();
  if (!last) return [];
  return [...last.sql.matchAll(/select\s+'(\w+)'\s*,\s*count\(\*\)/gi)].map(([, name]) => name);
}

describe('db-schema.config frente a las migraciones', () => {
  const configured = new Set(DB_TABLES.map((t) => t.sqlName));
  const counted = countedTables();

  it('encuentra las migraciones', () => {
    expect(migrations.length).toBeGreaterThan(0);
    expect(counted.length).toBeGreaterThan(0);
  });

  it('cada tabla creada en una migración está en el mapa', () => {
    for (const table of migratedTables()) {
      expect(configured.has(table), `falta "${table}" en db-schema.config.ts`).toBe(true);
    }
  });

  it('db_table_counts() cuenta exactamente las tablas del mapa', () => {
    expect([...counted].sort()).toEqual(DB_TABLES.map((t) => t.name).sort());
  });
});
