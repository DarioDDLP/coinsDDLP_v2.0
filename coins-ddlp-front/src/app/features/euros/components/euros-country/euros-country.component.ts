import {
  afterRenderEffect,
  Component,
  computed,
  effect,
  ElementRef,
  ErrorHandler,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { map, Subscription } from 'rxjs';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { PageLayoutComponent } from '../../../../shared/components/page-layout/page-layout.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { EmptyPanelComponent } from '../../../../shared/components/empty-panel/empty-panel.component';
import { ErrorPanelComponent } from '../../../../shared/components/error-panel/error-panel.component';
import { getEmptyState } from '../../../../shared/helpers/empty-state.helper';
import { ProgressStatComponent } from '../../../../shared/components/progress-stat/progress-stat.component';
import { FilterPillsComponent } from '../../../../shared/components/filter-pills/filter-pills.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import { EurosService } from '../../services/euros.service';
import { OwnerService } from '../../../../core/services/owner.service';
import { EuroCoin } from '../../../../shared/interfaces/euro-coin.interface';
import { OwnerSlug } from '../../../../shared/interfaces/owner.interface';
import { I18nService, injectLiterals } from '../../../../shared/services/i18n.service';
import { TOAST_MESSAGES } from '../../../../shared/constants/toast-messages.const';
import { getOwnershipFilterOptions } from '../../../../shared/constants/ownership-filter.config';
import { getOwnerFilterOptions } from '../../../../shared/constants/owner-filter.config';
import { normalizeString } from '../../../../shared/helpers/normalize-strings.helper';
import {
  restoreSearchQuery,
  saveSearchQuery,
} from '../../../../shared/helpers/search-state.helper';
import { getConservationBadge, getUdsBadge } from '../../../../shared/helpers/badge.helpers';
import { ExcelExportService, ExcelLabels } from '../../../../shared/services/excel-export.service';
import { sortByFaceValue } from '../../constants/face-value-order.const';
import { CoinUdsDialogComponent } from '../coin-uds-dialog/coin-uds-dialog.component';
import { injectCanEditCoins } from '../../euros-permissions';
import { injectCan } from '../../../../core/services/permissions.service';
import { isOwned } from '../../../../shared/helpers/ownership.helper';
import { CountryNamePipe } from '../../../../shared/pipes/country-name.pipe';
import { FaceValuePipe } from '../../../../shared/pipes/face-value.pipe';

interface YearChip {
  year: number | null;
  label: string;
  total: number;
}

/**
 * Vista de un país: chips de año (o "Todos"), filtros y tabla de monedas.
 * El detalle se abre como ruta hija (moneda/:id) en un panel lateral sobre esta vista.
 */
@Component({
  selector: 'app-euros-country',
  imports: [
    FaceValuePipe,
    CountryNamePipe,
    RouterOutlet,
    TableModule,
    PageLayoutComponent,
    BadgeComponent,
    ButtonComponent,
    EmptyPanelComponent,
    ErrorPanelComponent,
    ProgressStatComponent,
    FilterPillsComponent,
    ConfirmDialogComponent,
    SkeletonComponent,
    CoinUdsDialogComponent,
  ],
  templateUrl: './euros-country.component.html',
  styleUrl: './euros-country.component.scss',
})
export class EurosCountryComponent {
  private i18n = inject(I18nService);
  private eurosService = inject(EurosService);
  private messageService = inject(MessageService);
  private excelExport = inject(ExcelExportService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private errorHandler = inject(ErrorHandler);
  readonly ownerService = inject(OwnerService);

  readonly literals = injectLiterals('euros');
  readonly sharedLiterals = injectLiterals('shared');
  private excelLiterals = injectLiterals('excel');
  private excelLabels = computed<ExcelLabels>(() => ({
    ...this.excelLiterals(),
    ownerDario: this.sharedLiterals().ownerDario,
    ownerManolo: this.sharedLiterals().ownerManolo,
  }));
  readonly ownerOptions = computed(() => getOwnerFilterOptions(this.sharedLiterals()));
  readonly ownershipOptions = computed(() => getOwnershipFilterOptions(this.sharedLiterals()));
  readonly backLink = ['/euros'];

  readonly country = toSignal(this.route.paramMap.pipe(map((p) => p.get('country') ?? '')), {
    initialValue: '',
  });
  private readonly yearParam = toSignal(
    this.route.queryParamMap.pipe(map((q) => Number(q.get('year')) || null)),
    { initialValue: null },
  );

  private coinsData = signal<EuroCoin[]>([]);
  /** País + colección cargados: si cambian se vuelve a mostrar el skeleton. */
  private loadedKey = '';
  private loadSub?: Subscription;
  readonly isReady = signal(false);
  readonly hasError = signal(false);
  readonly searchQuery = signal('');
  readonly ownershipFilter = signal('all');

  readonly dialogVisible = signal(false);
  readonly selectedCoin = signal<EuroCoin | null>(null);
  readonly deleteDialogVisible = signal(false);
  readonly selectedDeleteCoin = signal<EuroCoin | null>(null);
  readonly deleteLoading = signal(false);

  readonly canEdit = injectCanEditCoins();
  readonly canDelete = injectCan('euros.delete');
  readonly showActions = computed(() => this.canEdit() || this.canDelete());
  readonly canExport = injectCan('export.excel');
  readonly canSwitchCollection = injectCan('collection.switch');
  private readonly yearChipsNav = viewChild<ElementRef<HTMLElement>>('yearChipsNav');
  readonly isBoth = computed(() => this.ownerService.current() === 'both');
  readonly emptyState = computed(() =>
    getEmptyState(this.sharedLiterals(), this.searchQuery(), this.ownershipFilter()),
  );

  constructor() {
    // Al cambiar de país: restaurar su búsqueda guardada
    effect(() => {
      const key = this.searchKey(this.country());
      untracked(() => this.searchQuery.set(restoreSearchQuery(key)));
    });

    // Recarga por país, colección activa o tras editar/borrar una moneda (esta última sin skeleton)
    effect(() => {
      const country = this.country();
      const key = `${country}|${this.ownerService.current()}`;
      this.eurosService.revision();
      if (!country) return;
      untracked(() => {
        this.loadCoins(country, key !== this.loadedKey);
        this.loadedKey = key;
      });
    });

    // Mantiene visible el chip del año activo (en móvil la fila hace scroll horizontal)
    afterRenderEffect(() => {
      this.selectedYear();
      const nav = this.yearChipsNav()?.nativeElement;
      const active = nav?.querySelector<HTMLElement>('.year-chip--active');
      if (nav && active) {
        nav.scrollTo({ left: active.offsetLeft - nav.clientWidth / 2 + active.clientWidth / 2 });
      }
    });
  }

  loadCoins(country: string, showSkeleton = true): void {
    this.hasError.set(false);
    if (showSkeleton) this.isReady.set(false);
    // Solo cuenta la última petición: una anterior que llegue tarde no pisa los datos nuevos
    this.loadSub?.unsubscribe();
    this.loadSub = this.eurosService.getAllByCountry(country).subscribe({
      next: (coins) => {
        this.coinsData.set(coins);
        this.isReady.set(true);
      },
      error: (e) => {
        this.errorHandler.handleError(e);
        // Si falla una recarga tras editar se mantienen los datos: basta con el toast
        if (showSkeleton) this.hasError.set(true);
        this.isReady.set(true);
      },
    });
  }

  // --- Años ---

  readonly yearChips = computed<YearChip[]>(() => {
    const counts = new Map<number, number>();
    for (const c of this.coinsData()) counts.set(c.year, (counts.get(c.year) ?? 0) + 1);
    const years = [...counts.entries()]
      .sort(([a], [b]) => a - b)
      .map(([year, total]) => ({ year, label: String(year), total }));
    return [
      { year: null, label: this.literals().allYears, total: this.coinsData().length },
      ...years,
    ];
  });

  /** Año seleccionado; null = todos. Un año que no existe en el país se trata como "todos". */
  readonly selectedYear = computed(() => {
    const year = this.yearParam();
    return year !== null && this.yearChips().some((c) => c.year === year) ? year : null;
  });

  // --- Datos filtrados ---

  readonly visibleCoins = computed(() => {
    const year = this.selectedYear();
    const ownership = this.ownershipFilter();
    const both = this.isBoth();
    const query = normalizeString(this.searchQuery());

    return this.coinsData()
      .filter((c) => year === null || c.year === year)
      .filter((c) => {
        if (ownership === 'owned') return isOwned(c.uds, c.udsAlt, both);
        if (ownership === 'missing')
          return both ? c.uds === 0 && (c.udsAlt ?? 0) === 0 : c.uds === 0;
        return true;
      })
      .filter(
        (c) =>
          !query ||
          normalizeString(c.faceValue).includes(query) ||
          normalizeString(c.description).includes(query),
      )
      .sort((a, b) => (a.year !== b.year ? a.year - b.year : sortByFaceValue(a, b)));
  });

  readonly coinRows = computed(() =>
    this.visibleCoins().map((coin) => ({
      coin,
      year: coin.year,
      conservationBadge: getConservationBadge(coin.conservation),
      udsBadge: getUdsBadge(coin.uds),
      conservationBadgeAlt: coin.conservationAlt
        ? getConservationBadge(coin.conservationAlt)
        : null,
      udsBadgeAlt: coin.udsAlt !== undefined ? getUdsBadge(coin.udsAlt) : null,
    })),
  );

  readonly hasMint = computed(() => this.visibleCoins().some((c) => c.mint));
  readonly hasNonCirculating = computed(() => this.visibleCoins().some((c) => !c.circulation));

  // --- Cabecera ---

  readonly progress = computed(() => {
    const both = this.isBoth();
    const coins = this.coinsData();
    return {
      owned: coins.filter((c) => isOwned(c.uds, c.udsAlt, both)).length,
      total: coins.length,
    };
  });

  readonly subtitle = computed(() => {
    const coins = this.coinsData();
    if (coins.length === 0) return '';
    const years = coins.map((c) => c.year);
    const commemorative = coins.filter((c) => c.commemorative).length;
    return [
      `${Math.min(...years)} — ${Math.max(...years)}`,
      `${coins.length - commemorative} ${this.literals().regular}`,
      `${commemorative} ${this.literals().commemorative}`,
    ].join(' · ');
  });

  readonly searchPlaceholder = computed(() => {
    const year = this.selectedYear();
    return year ? `${this.literals().searchInYear} ${year}…` : this.literals().searchCoins;
  });

  // --- Acciones ---

  selectYear(year: number | null): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { year },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    saveSearchQuery(this.searchKey(this.country()), query);
  }

  onOwnerChange(slug: string): void {
    this.ownerService.setOwner(slug as OwnerSlug);
  }

  openCoin(coin: EuroCoin): void {
    this.router.navigate(['moneda', coin.id], {
      relativeTo: this.route,
      queryParamsHandling: 'preserve',
    });
  }

  onEditUnits(coin: EuroCoin): void {
    this.selectedCoin.set(coin);
    this.dialogVisible.set(true);
  }

  onDeleteCoin(coin: EuroCoin): void {
    this.selectedDeleteCoin.set(coin);
    this.deleteDialogVisible.set(true);
  }

  async onConfirmDelete(): Promise<void> {
    const coin = this.selectedDeleteCoin();
    if (!coin) return;
    this.deleteLoading.set(true);
    try {
      await this.eurosService.remove(coin.id);
      this.messageService.add(this.i18n.toast(TOAST_MESSAGES.euros.deleteSuccess));
      this.deleteDialogVisible.set(false);
    } catch (e) {
      this.errorHandler.handleError(e);
    } finally {
      this.deleteLoading.set(false);
    }
  }

  async exportExcel(): Promise<void> {
    const year = this.selectedYear();
    const coins = this.visibleCoins();
    if (year !== null) {
      await this.excelExport.exportEurosYear(
        coins,
        this.country(),
        year,
        this.hasMint(),
        this.excelLabels(),
        this.isBoth(),
      );
    } else {
      await this.excelExport.exportEurosAll(
        coins,
        this.country(),
        this.hasMint(),
        this.excelLabels(),
        this.isBoth(),
      );
    }
  }

  private searchKey(country: string): string {
    return `euros-country-${country}`;
  }
}
