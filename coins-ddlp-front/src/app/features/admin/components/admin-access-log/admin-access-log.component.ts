import {
  Component,
  computed,
  DestroyRef,
  effect,
  ErrorHandler,
  inject,
  OnInit,
  signal,
  untracked,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { Paginator, PaginatorState } from 'primeng/paginator';
import { Subscription } from 'rxjs';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { FilterPillsComponent } from '../../../../shared/components/filter-pills/filter-pills.component';
import {
  SelectComponent,
  SelectOption,
} from '../../../../shared/components/select/select.component';
import { SearchInputComponent } from '../../../../shared/components/search-input/search-input.component';
import { ToggleComponent } from '../../../../shared/components/toggle/toggle.component';
import { ErrorPanelComponent } from '../../../../shared/components/error-panel/error-panel.component';
import { EmptyPanelComponent } from '../../../../shared/components/empty-panel/empty-panel.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AccessVisitDialogComponent } from '../access-visit-dialog/access-visit-dialog.component';
import {
  AccessLogFilter,
  AccessLogStats,
  AccessVisit,
} from '../../../../shared/interfaces/access-log.interface';
import {
  AccessLogPeriod,
  getAccessLogPeriodOptions,
} from '../../../../shared/constants/access-log-filter.config';
import {
  formatDuration,
  formatLocation,
  getDeviceIcon,
  getPeriodStart,
} from '../../../../shared/helpers/access-log.helper';
import { getEmptyState } from '../../../../shared/helpers/empty-state.helper';
import { I18nService, injectLiterals } from '../../../../shared/services/i18n.service';
import { ExcelExportService } from '../../../../shared/services/excel-export.service';
import { TOAST_MESSAGES } from '../../../../shared/constants/toast-messages.const';
import { AuthService } from '../../../../core/services/auth.service';
import { AccessLogAdminService } from '../../services/access-log-admin.service';
import { AdminService } from '../../services/admin.service';

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;
const EMPTY_STATS: AccessLogStats = {
  visits: 0,
  visitors: 0,
  users: 0,
  logins: 0,
  failedLogins: 0,
};

/** Valores especiales del filtro de usuario (el resto son uids). */
const USER_ALL = 'all';

/** Registro de accesos: cifras, filtros, tabla paginada en el servidor y detalle de cada visita. */
@Component({
  selector: 'app-admin-access-log',
  imports: [
    TableModule,
    Paginator,
    DatePipe,
    ButtonComponent,
    SkeletonComponent,
    BadgeComponent,
    StatCardComponent,
    FilterPillsComponent,
    SelectComponent,
    SearchInputComponent,
    ToggleComponent,
    ErrorPanelComponent,
    EmptyPanelComponent,
    ConfirmDialogComponent,
    AccessVisitDialogComponent,
  ],
  templateUrl: './admin-access-log.component.html',
  styleUrl: './admin-access-log.component.scss',
})
export class AdminAccessLogComponent implements OnInit {
  private service = inject(AccessLogAdminService);
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private excelExport = inject(ExcelExportService);
  private messageService = inject(MessageService);
  private errorHandler = inject(ErrorHandler);
  private i18n = inject(I18nService);
  readonly lang = this.i18n.lang;

  readonly literals = injectLiterals('admin');
  readonly sharedLiterals = injectLiterals('shared');
  readonly t = computed(() => this.literals().accessLog);
  readonly pageSize = PAGE_SIZE;

  // Filtros
  readonly period = signal<AccessLogPeriod>('7d');
  readonly user = signal(USER_ALL);
  readonly searchText = signal('');
  private readonly search = signal('');
  readonly hideMine = signal(true);
  private searchTimer?: ReturnType<typeof setTimeout>;

  readonly periodOptions = computed(() => getAccessLogPeriodOptions(this.t()));
  private users = signal<SelectOption[]>([]);
  readonly userOptions = computed<SelectOption[]>(() => [
    { value: USER_ALL, label: this.t().userAll },
    { value: 'anon', label: this.t().userAnon },
    { value: 'users', label: this.t().userLogged },
    ...this.users(),
  ]);

  private readonly filter = computed<AccessLogFilter>(() => ({
    from: getPeriodStart(this.period()),
    user: this.user() === USER_ALL ? null : this.user(),
    excludeUserId: this.hideMine() ? (this.authService.currentUser()?.uid ?? null) : null,
    search: this.search(),
  }));

  // Datos
  readonly visits = signal<AccessVisit[]>([]);
  readonly total = signal(0);
  readonly first = signal(0);
  readonly stats = signal<AccessLogStats>(EMPTY_STATS);
  readonly isReady = signal(false);
  readonly hasError = signal(false);
  private readonly revision = signal(0);
  private loadSub?: Subscription;
  private statsSub?: Subscription;

  readonly rows = computed(() =>
    this.visits().map((visit) => {
      const t = this.t();
      return {
        visit,
        location: formatLocation(visit) ?? t.unknown,
        deviceIcon: getDeviceIcon(visit.deviceType),
        deviceLabel: visit.deviceType ? t.devices[visit.deviceType] : t.unknown,
        browser: [visit.browser, visit.os].filter(Boolean).join(' · ') || t.unknown,
        duration: formatDuration(visit.durationSeconds),
      };
    }),
  );

  readonly failedHint = computed(() =>
    this.stats().failedLogins ? `${this.stats().failedLogins} ${this.t().kpiFailed}` : '',
  );

  readonly emptyState = computed(() => getEmptyState(this.sharedLiterals(), this.search()));

  // Detalle, exportación y vaciado
  readonly selectedVisit = signal<AccessVisit | null>(null);
  readonly detailVisible = signal(false);
  readonly exporting = signal(false);
  readonly clearDialogVisible = signal(false);
  readonly clearing = signal(false);

  constructor() {
    // Al cambiar un filtro (o tras vaciar): vuelta a la primera página, con skeleton
    effect(() => {
      const filter = this.filter();
      this.revision();
      untracked(() => {
        this.isReady.set(false);
        this.load(filter, 0);
      });
    });

    inject(DestroyRef).onDestroy(() => clearTimeout(this.searchTimer));
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  private load(filter: AccessLogFilter, first: number): void {
    this.hasError.set(false);
    this.first.set(first);
    this.loadSub?.unsubscribe();
    this.loadSub = this.service.getPage(filter, first, PAGE_SIZE).subscribe({
      next: ({ rows, total }) => {
        this.visits.set(rows);
        this.total.set(total);
        this.isReady.set(true);
      },
      error: (e) => {
        this.errorHandler.handleError(e);
        // Si falla al pasar de página se mantienen los datos; el panel solo en la carga con skeleton
        if (!this.isReady()) this.hasError.set(true);
        this.isReady.set(true);
      },
    });

    // Las cifras solo cambian con los filtros, no al pasar de página
    if (first !== 0) return;
    this.statsSub?.unsubscribe();
    this.statsSub = this.service.getStats(filter).subscribe({
      next: (stats) => this.stats.set(stats),
      error: (e) => this.errorHandler.handleError(e),
    });
  }

  /** Usuarios para el filtro (por nombre o, si no tiene, por email). */
  private loadUsers(): void {
    this.adminService.getUsers().subscribe({
      next: (users) =>
        this.users.set(
          users
            .map((u) => ({ value: u.uid, label: u.displayName || u.email || u.uid }))
            .sort((a, b) => a.label.localeCompare(b.label)),
        ),
      error: (e) => this.errorHandler.handleError(e),
    });
  }

  protected onSearch(value: string): void {
    this.searchText.set(value);
    clearTimeout(this.searchTimer);
    // Borrar la búsqueda (botón del panel vacío) se aplica al momento
    if (!value) {
      this.search.set('');
      return;
    }
    this.searchTimer = setTimeout(() => this.search.set(value), SEARCH_DEBOUNCE_MS);
  }

  protected onPeriod(value: string): void {
    this.period.set(value as AccessLogPeriod);
  }

  protected onPage(event: PaginatorState): void {
    this.load(this.filter(), event.first ?? 0);
  }

  protected onRetry(): void {
    this.revision.update((r) => r + 1);
  }

  protected openVisit(visit: AccessVisit): void {
    this.selectedVisit.set(visit);
    this.detailVisible.set(true);
  }

  protected onExport(): void {
    this.exporting.set(true);
    this.service.getAll(this.filter()).subscribe({
      next: async (visits) => {
        try {
          await this.excelExport.exportAccessLog(visits, this.t());
        } catch (e) {
          this.errorHandler.handleError(e);
        } finally {
          this.exporting.set(false);
        }
      },
      error: (e) => {
        this.errorHandler.handleError(e);
        this.exporting.set(false);
      },
    });
  }

  protected async onConfirmClear(): Promise<void> {
    this.clearing.set(true);
    try {
      await this.service.clear();
      this.messageService.add(this.i18n.toast(TOAST_MESSAGES.admin.accessLogCleared));
      this.clearDialogVisible.set(false);
      this.revision.update((r) => r + 1);
    } catch (e) {
      this.errorHandler.handleError(e);
    } finally {
      this.clearing.set(false);
    }
  }
}
