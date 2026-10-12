import { DB_GROUPS, DB_PROCESSES, DB_RELATIONS, DB_TABLES } from './db-schema.config';

const tableNames = new Set(DB_TABLES.map((t) => t.name));

describe('db-schema.config', () => {
  it('no repite tablas y todas usan un dominio conocido', () => {
    expect(tableNames.size).toBe(DB_TABLES.length);
    for (const table of DB_TABLES) expect(DB_GROUPS).toContain(table.group);
  });

  it('cada relación sale de una columna FK que apunta a esa tabla', () => {
    for (const r of DB_RELATIONS) {
      const from = DB_TABLES.find((t) => t.name === r.from);
      expect(from, r.from).toBeDefined();
      expect(tableNames.has(r.to), r.to).toBe(true);
      expect(from!.columns.find((c) => c.name === r.column)?.fk, `${r.from}.${r.column}`).toBe(
        r.to,
      );
    }
  });

  it('cada columna FK tiene su relación', () => {
    for (const table of DB_TABLES) {
      for (const column of table.columns.filter((c) => c.fk)) {
        const found = DB_RELATIONS.some((r) => r.from === table.name && r.column === column.name);
        expect(found, `${table.name}.${column.name}`).toBe(true);
      }
    }
  });

  it('los procesos solo escriben tablas del diagrama', () => {
    for (const process of DB_PROCESSES) {
      for (const name of process.writes) expect(tableNames.has(name), name).toBe(true);
    }
  });

  it('las tarjetas del diagrama no se solapan', () => {
    const boxes = DB_TABLES.map((t) => ({
      name: t.name,
      x: t.x,
      y: t.y,
      rows: t.columns.filter((c) => c.pk || c.fk || c.inDiagram).length,
    }));
    for (const a of boxes) {
      for (const b of boxes) {
        if (a === b || a.x !== b.x) continue;
        const aBottom = a.y + 34 + a.rows * 22 + 8;
        const overlaps = a.y < b.y && aBottom > b.y;
        expect(overlaps, `${a.name} / ${b.name}`).toBe(false);
      }
    }
  });
});
