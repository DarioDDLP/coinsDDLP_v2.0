import { formatNumber } from '@angular/common';
import { Component, computed, inject, input, model } from '@angular/core';
import { DialogComponent } from '../../../../shared/components/dialog/dialog.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import {
  DbAccessRule,
  DbOperation,
  DbTableCounts,
  DbTableName,
} from '../../../../shared/interfaces/db-schema.interface';
import { Severity } from '../../../../shared/interfaces/severity.interface';
import { getPermissionLabelKey } from '../../../../shared/constants/permissions.const';
import { I18nService, injectLiterals } from '../../../../shared/services/i18n.service';
import { DB_PROCESSES, DB_RELATIONS, DB_TABLES } from '../../config/db-schema.config';

const OPERATIONS: DbOperation[] = ['select', 'insert', 'update', 'delete'];

const ACCESS_SEVERITY: Record<DbAccessRule['level'], Severity> = {
  public: 'success',
  authenticated: 'info',
  self: 'info',
  permission: 'accent',
  admin: 'warn',
  service: 'secondary',
  none: 'neutral',
};

interface AccessBadge {
  label: string;
  severity: Severity;
  tooltip?: string;
}

/** Detalle de una tabla: descripción, acceso (RLS), relaciones, quién la escribe y columnas. */
@Component({
  selector: 'app-db-table-dialog',
  imports: [DialogComponent, BadgeComponent],
  templateUrl: './db-table-dialog.component.html',
  styleUrl: './db-table-dialog.component.scss',
})
export class DbTableDialogComponent {
  readonly visible = model(false);
  /** Tabla mostrada; las relaciones la cambian sin cerrar el diálogo. */
  readonly tableName = model<DbTableName | null>(null);
  readonly counts = input<DbTableCounts>({});

  private lang = inject(I18nService).lang;
  private literals = injectLiterals('admin');
  readonly t = computed(() => this.literals().db);

  readonly table = computed(() => DB_TABLES.find((t) => t.name === this.tableName()) ?? null);

  readonly detail = computed(() => {
    const table = this.table();
    if (!table) return null;
    const t = this.t();
    const texts = t.tables[table.name];
    const notes = texts.columns as Record<string, string>;
    const count = this.counts()[table.name];

    const writtenBy = DB_PROCESSES.filter((p) => p.writes.includes(table.name)).map(
      (p) => t.processes[p.name].label,
    );
    const appWrites = OPERATIONS.filter((op) => op !== 'select').some((op) =>
      table.access[op].some((r) => r.level !== 'service' && r.level !== 'none'),
    );

    return {
      table,
      description: texts.description,
      group: t.groups[table.group],
      rows: count === undefined ? null : formatNumber(count, this.lang(), '1.0-0'),
      access: OPERATIONS.map((op) => ({
        label: t.operations[op],
        badges: table.access[op].flatMap((rule) => this.badges(rule)),
      })),
      outgoing: DB_RELATIONS.filter((r) => r.from === table.name).map((r) => ({
        column: r.column,
        table: r.to,
        sqlName: DB_TABLES.find((x) => x.name === r.to)!.sqlName,
        onDelete: t.onDelete[r.onDelete],
      })),
      incoming: DB_RELATIONS.filter((r) => r.to === table.name).map((r) => ({
        column: r.column,
        table: r.from,
        sqlName: DB_TABLES.find((x) => x.name === r.from)!.sqlName,
        onDelete: t.onDelete[r.onDelete],
      })),
      writers: appWrites ? [t.dialog.frontend, ...writtenBy] : writtenBy,
      columns: table.columns.map((c) => ({ ...c, note: notes[c.name] ?? '' })),
    };
  });

  private badges(rule: DbAccessRule): AccessBadge[] {
    const t = this.t().access;
    const items = this.literals().permissions.items;
    const permissions = (rule.permissions ?? []).map((p) => ({
      label: items[getPermissionLabelKey(p)],
      severity: ACCESS_SEVERITY.permission,
      tooltip: p,
    }));
    // Con permisos, su texto ya dice el alcance («de su colección»): no se repite «Solo las suyas»
    if (permissions.length || rule.level === 'permission') return permissions;
    return [{ label: t[rule.level], severity: ACCESS_SEVERITY[rule.level] }];
  }

  protected goTo(name: DbTableName): void {
    this.tableName.set(name);
  }
}
