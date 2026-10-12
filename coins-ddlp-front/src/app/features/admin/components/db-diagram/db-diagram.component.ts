import { formatNumber } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import {
  DbColumn,
  DbProcessName,
  DbTable,
  DbTableCounts,
  DbTableName,
} from '../../../../shared/interfaces/db-schema.interface';
import { connectorPath, DiagramRect } from '../../../../shared/helpers/diagram.helper';
import { I18nService, injectLiterals } from '../../../../shared/services/i18n.service';
import { DB_DIAGRAM, DB_PROCESSES, DB_RELATIONS, DB_TABLES } from '../../config/db-schema.config';

type Highlight = { kind: 'table'; name: DbTableName } | { kind: 'process'; name: DbProcessName };

const D = DB_DIAGRAM;

/** Columnas que se pintan en la tarjeta: PK, FK y las marcadas `inDiagram`. */
function diagramColumns(table: DbTable): DbColumn[] {
  return table.columns.filter((c) => c.pk || c.fk || c.inDiagram);
}

function cardRect(table: DbTable): DiagramRect {
  const rows = diagramColumns(table).length;
  return {
    x: table.x,
    y: table.y,
    width: D.cardWidth,
    height: D.headerHeight + rows * D.rowHeight + D.paddingBottom,
  };
}

const RECTS = new Map(DB_TABLES.map((t) => [t.name, cardRect(t)]));

/**
 * Diagrama entidad-relación en SVG (escala con el viewBox). Al pasar por encima o enfocar una
 * tabla o un proceso se resalta lo relacionado; al pulsar una tabla emite `selected`.
 */
@Component({
  selector: 'app-db-diagram',
  templateUrl: './db-diagram.component.html',
  styleUrl: './db-diagram.component.scss',
})
export class DbDiagramComponent {
  readonly counts = input<DbTableCounts>({});
  readonly selected = output<DbTableName>();

  private lang = inject(I18nService).lang;
  private literals = injectLiterals('admin');
  readonly t = computed(() => this.literals().db);

  readonly viewBox = `0 0 ${D.width} ${D.height}`;
  readonly highlight = signal<Highlight | null>(null);

  readonly cards = computed(() => {
    const counts = this.counts();
    const t = this.t();
    return DB_TABLES.map((table) => {
      const rect = RECTS.get(table.name)!;
      const count = counts[table.name];
      const rowsLabel = count === undefined ? '' : formatNumber(count, this.lang(), '1.0-0');
      return {
        table,
        rect,
        rowsLabel,
        ariaLabel: `${table.sqlName}${rowsLabel ? `, ${rowsLabel} ${t.rows}` : ''}`,
        columns: diagramColumns(table).map((column, i) => ({
          column,
          tag: column.pk ? 'PK' : column.fk ? 'FK' : '',
          y: rect.y + D.headerHeight + i * D.rowHeight + 15,
        })),
      };
    });
  });

  readonly edges = DB_RELATIONS.map((relation) => ({
    relation,
    path: connectorPath(RECTS.get(relation.from)!, RECTS.get(relation.to)!),
  }));

  readonly processes = computed(() =>
    DB_PROCESSES.map((process, i) => ({
      process,
      rect: { x: D.columns[i], y: D.processY, width: D.cardWidth, height: D.processHeight },
      text: this.t().processes[process.name],
    })),
  );
  readonly processLabelY = D.processY - 10;

  /** Lo que se resalta con el elemento activo (si no hay ninguno, todo normal). */
  readonly related = computed(() => {
    const h = this.highlight();
    const tables = new Set<DbTableName>();
    const processes = new Set<DbProcessName>();
    const relations = new Set<number>();
    if (h?.kind === 'table') {
      tables.add(h.name);
      DB_RELATIONS.forEach((r, i) => {
        if (r.from !== h.name && r.to !== h.name) return;
        relations.add(i);
        tables.add(r.from);
        tables.add(r.to);
      });
      DB_PROCESSES.filter((p) => p.writes.includes(h.name)).forEach((p) => processes.add(p.name));
    } else if (h?.kind === 'process') {
      processes.add(h.name);
      DB_PROCESSES.find((p) => p.name === h.name)?.writes.forEach((name) => tables.add(name));
    }
    return { active: !!h, tables, processes, relations };
  });

  protected onSelect(name: DbTableName, event?: Event): void {
    event?.preventDefault();
    this.selected.emit(name);
  }
}
