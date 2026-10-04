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
import { map } from 'rxjs';
import { TableModule } from 'primeng/table';
import { PageLayoutComponent } from '../../../../shared/components/page-layout/page-layout.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { EmptyPanelComponent } from '../../../../shared/components/empty-panel/empty-panel.component';
import { ErrorPanelComponent } from '../../../../shared/components/error-panel/error-panel.component';
import { getEmptyState } from '../../../../shared/helpers/empty-state.helper';
import { ProgressStatComponent } from '../../../../shared/components/progress-stat/progress-stat.component';
import { FilterPillsComponent } from '../../../../shared/components/filter-pills/filter-pills.component';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import { PesetasService } from '../../services/pesetas.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Peseta } from '../../../../shared/interfaces/peseta.interface';
import { LITERALS } from '../../../../shared/constants/literals';
import { OWNERSHIP_FILTER_OPTIONS } from '../../../../shared/constants/ownership-filter.config';
import { normalizeString } from '../../../../shared/helpers/normalize-strings.helper';
import {
  restoreSearchQuery,
  saveSearchQuery,
} from '../../../../shared/helpers/search-state.helper';
import { getConservationBadge, getUdsBadge } from '../../../../shared/helpers/badge.helpers';
import { PesetaEditDialogComponent } from '../peseta-edit-dialog/peseta-edit-dialog.component';
import { denominationSortKey } from '../../denomination-order';

interface DenominationChip {
  /** null = todas las denominaciones */
  value: string | null;
  label: string;
  owned: number;
  total: number;
}

const SEARCH_KEY = 'pesetas';

/**
 * Colección de pesetas en una sola vista: chips de denominación ("Todas" + cada valor),
 * filtros y tabla. El detalle se abre como ruta hija (moneda/:id) en un panel lateral.
 */
@Component({
  selector: 'app-pesetas-browser',
  imports: [
    RouterOutlet,
    TableModule,
    PageLayoutComponent,
    BadgeComponent,
    ButtonComponent,
    EmptyPanelComponent,
    ErrorPanelComponent,
    ProgressStatComponent,
    FilterPillsComponent,
    SkeletonComponent,
    PesetaEditDialogComponent,
  ],
  templateUrl: './pesetas-browser.component.html',
  styleUrl: './pesetas-browser.component.scss',
})
export class PesetasBrowserComponent {
  private service = inject(PesetasService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private errorHandler = inject(ErrorHandler);
  readonly authService = inject(AuthService);

  readonly literals = LITERALS.pesetas;
  readonly sharedLiterals = LITERALS.shared;
  readonly ownershipOptions = OWNERSHIP_FILTER_OPTIONS;

  private readonly valueParam = toSignal(
    this.route.queryParamMap.pipe(map((q) => q.get('valor'))),
    { initialValue: null },
  );

  private pesetas = signal<Peseta[]>([]);
  readonly isReady = signal(false);
  readonly hasError = signal(false);
  readonly searchQuery = signal(restoreSearchQuery(SEARCH_KEY));
  readonly ownershipFilter = signal('all');
  readonly emptyState = computed(() => getEmptyState(this.searchQuery(), this.ownershipFilter()));

  readonly dialogVisible = signal(false);
  readonly selectedPeseta = signal<Peseta | null>(null);

  private readonly chipsNav = viewChild<ElementRef<HTMLElement>>('chipsNav');

  constructor() {
    // Recarga tras editar una peseta, sin volver al skeleton
    effect(() => {
      this.service.revision();
      untracked(() => this.loadPesetas(false));
    });

    // Mantiene visible el chip activo (en móvil la fila hace scroll horizontal)
    afterRenderEffect(() => {
      this.selectedValue();
      const nav = this.chipsNav()?.nativeElement;
      const active = nav?.querySelector<HTMLElement>('.value-chip--active');
      if (nav && active) {
        nav.scrollTo({ left: active.offsetLeft - nav.clientWidth / 2 + active.clientWidth / 2 });
      }
    });
  }

  loadPesetas(showSkeleton = true): void {
    this.hasError.set(false);
    if (showSkeleton) this.isReady.set(false);
    this.service.getAll().subscribe({
      next: (pesetas) => {
        this.pesetas.set(pesetas);
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

  // --- Denominaciones ---

  readonly chips = computed<DenominationChip[]>(() => {
    const byValue = new Map<string, DenominationChip & { order: number }>();
    for (const p of this.pesetas()) {
      const label = p.peseta_type.faceValueLabel;
      const chip = byValue.get(label) ?? {
        value: label,
        label,
        owned: 0,
        total: 0,
        order: denominationSortKey(label, p.peseta_type.faceValueESP),
      };
      chip.total++;
      if (p.uds > 0) chip.owned++;
      byValue.set(label, chip);
    }
    const values = [...byValue.values()].sort((a, b) => a.order - b.order);
    const all = this.progress();
    return [{ value: null, label: this.literals.allLabel, ...all }, ...values];
  });

  /** Denominación seleccionada; null = todas. Un valor desconocido se trata como "todas". */
  readonly selectedValue = computed(() => {
    const value = this.valueParam();
    return value && this.chips().some((c) => c.value === value) ? value : null;
  });

  // --- Datos filtrados ---

  readonly rows = computed(() => {
    const value = this.selectedValue();
    const ownership = this.ownershipFilter();
    const query = normalizeString(this.searchQuery());
    // Posición de cada denominación según los chips (ya ordenados por valor)
    const order = new Map(this.chips().map((c, i) => [c.value, i]));

    return this.pesetas()
      .filter((p) => value === null || p.peseta_type.faceValueLabel === value)
      .filter((p) =>
        ownership === 'owned' ? p.uds > 0 : ownership === 'missing' ? p.uds === 0 : true,
      )
      .filter(
        (p) =>
          !query ||
          normalizeString(p.peseta_type.faceValueLabel).includes(query) ||
          normalizeString(p.peseta_type.title).includes(query) ||
          normalizeString(p.label).includes(query),
      )
      .sort(
        (a, b) =>
          (order.get(a.peseta_type.faceValueLabel) ?? 0) -
            (order.get(b.peseta_type.faceValueLabel) ?? 0) || a.mintYear - b.mintYear,
      )
      .map((peseta) => ({
        peseta,
        denomination: peseta.peseta_type.faceValueLabel,
        // PrimeNG ordena los grupos como texto por groupRowsBy: la posición con ceros
        // a la izquierda mantiene el orden de los chips (cuartos → céntimos → pesetas)
        groupKey: String(order.get(peseta.peseta_type.faceValueLabel) ?? 0).padStart(3, '0'),
        conservationBadge: getConservationBadge(peseta.conservation),
        udsBadge: getUdsBadge(peseta.uds),
      }));
  });

  // --- Cabecera ---

  readonly progress = computed(() => {
    const pesetas = this.pesetas();
    return { owned: pesetas.filter((p) => p.uds > 0).length, total: pesetas.length };
  });

  readonly subtitle = computed(() => {
    const pesetas = this.pesetas();
    if (pesetas.length === 0) return '';
    const years = pesetas.map((p) => p.mintYear);
    const types = new Set(pesetas.map((p) => p.pesetaTypeId)).size;
    return [
      `${Math.min(...years)} — ${Math.max(...years)}`,
      `${types} ${this.literals.typesCount}`,
      `${pesetas.length} ${this.literals.coinsCount}`,
    ].join(' · ');
  });

  // --- Acciones ---

  selectValue(value: string | null): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { valor: value },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    saveSearchQuery(SEARCH_KEY, query);
  }

  openPeseta(peseta: Peseta): void {
    this.router.navigate(['moneda', peseta.id], {
      relativeTo: this.route,
      queryParamsHandling: 'preserve',
    });
  }

  onEdit(peseta: Peseta): void {
    this.selectedPeseta.set(peseta);
    this.dialogVisible.set(true);
  }
}
