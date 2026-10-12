import { formatNumber } from '@angular/common';
import { Component, computed, ErrorHandler, inject, OnInit, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { ErrorPanelComponent } from '../../../../shared/components/error-panel/error-panel.component';
import { DbTableCounts, DbTableName } from '../../../../shared/interfaces/db-schema.interface';
import { I18nService, injectLiterals } from '../../../../shared/services/i18n.service';
import { DbOverviewService } from '../../services/db-overview.service';
import { DB_GROUPS, DB_TABLES } from '../../config/db-schema.config';
import { DbDiagramComponent } from '../db-diagram/db-diagram.component';
import { DbFlowDiagramComponent } from '../db-flow-diagram/db-flow-diagram.component';
import { DbTableDialogComponent } from '../db-table-dialog/db-table-dialog.component';

/** Admin → Base de datos: cifras, diagrama de tablas, tablas por dominio y esquema de la app. */
@Component({
  selector: 'app-admin-database',
  imports: [
    SkeletonComponent,
    StatCardComponent,
    ErrorPanelComponent,
    DbDiagramComponent,
    DbFlowDiagramComponent,
    DbTableDialogComponent,
  ],
  templateUrl: './admin-database.component.html',
  styleUrl: './admin-database.component.scss',
})
export class AdminDatabaseComponent implements OnInit {
  private service = inject(DbOverviewService);
  private errorHandler = inject(ErrorHandler);
  private lang = inject(I18nService).lang;

  private literals = injectLiterals('admin');
  readonly t = computed(() => this.literals().db);

  readonly counts = signal<DbTableCounts>({});
  readonly isReady = signal(false);
  readonly hasError = signal(false);
  private loadSub?: Subscription;

  readonly tableCount = DB_TABLES.length;
  readonly totalRows = computed(() =>
    Object.values(this.counts()).reduce((sum, n) => sum + (n ?? 0), 0),
  );

  /** Tablas agrupadas por dominio (alternativa al diagrama en pantallas pequeñas). */
  readonly groups = computed(() => {
    const t = this.t();
    const counts = this.counts();
    return DB_GROUPS.map((group) => ({
      group,
      label: t.groups[group],
      tables: DB_TABLES.filter((table) => table.group === group).map((table) => ({
        name: table.name,
        sqlName: table.sqlName,
        rows:
          counts[table.name] === undefined
            ? ''
            : formatNumber(counts[table.name]!, this.lang(), '1.0-0'),
      })),
    }));
  });

  readonly selectedTable = signal<DbTableName | null>(null);
  readonly dialogVisible = signal(false);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.isReady.set(false);
    this.hasError.set(false);
    this.loadSub?.unsubscribe();
    this.loadSub = this.service.getTableCounts().subscribe({
      next: (counts) => {
        this.counts.set(counts);
        this.isReady.set(true);
      },
      error: (e) => {
        this.errorHandler.handleError(e);
        this.hasError.set(true);
        this.isReady.set(true);
      },
    });
  }

  protected onRetry(): void {
    this.load();
  }

  protected openTable(name: DbTableName): void {
    this.selectedTable.set(name);
    this.dialogVisible.set(true);
  }
}
