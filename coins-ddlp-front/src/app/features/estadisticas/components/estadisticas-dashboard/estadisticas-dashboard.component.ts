import {
  Component,
  computed,
  effect,
  ErrorHandler,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { formatNumber } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { PageLayoutComponent } from '../../../../shared/components/page-layout/page-layout.component';
import { ErrorPanelComponent } from '../../../../shared/components/error-panel/error-panel.component';
import { ProgressStatComponent } from '../../../../shared/components/progress-stat/progress-stat.component';
import { FilterPillsComponent } from '../../../../shared/components/filter-pills/filter-pills.component';
import { CountryFlagComponent } from '../../../../shared/components/country-flag/country-flag.component';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import { OwnerService } from '../../../../core/services/owner.service';
import { EuroStatsRow } from '../../../../shared/interfaces/euro-stats.interface';
import { OwnerSlug } from '../../../../shared/interfaces/owner.interface';
import { LITERALS } from '../../../../shared/constants/literals';
import { OWNER_FILTER_OPTIONS } from '../../../../shared/constants/owner-filter.config';
import {
  computeKpis,
  groupByCountry,
  groupByFaceValue,
  groupByYear,
} from '../../../../shared/helpers/euro-stats.helper';
import { EstadisticasService } from '../../services/estadisticas.service';
import { StatCardComponent } from '../stat-card/stat-card.component';
import { YearChartComponent } from '../year-chart/year-chart.component';

@Component({
  selector: 'app-estadisticas-dashboard',
  imports: [
    RouterLink,
    PageLayoutComponent,
    ErrorPanelComponent,
    ProgressStatComponent,
    FilterPillsComponent,
    CountryFlagComponent,
    SkeletonComponent,
    StatCardComponent,
    YearChartComponent,
  ],
  templateUrl: './estadisticas-dashboard.component.html',
  styleUrl: './estadisticas-dashboard.component.scss',
})
export class EstadisticasDashboardComponent {
  private estadisticasService = inject(EstadisticasService);
  private errorHandler = inject(ErrorHandler);
  readonly ownerService = inject(OwnerService);

  readonly literals = LITERALS.estadisticas;
  readonly sharedLiterals = LITERALS.shared;
  readonly ownerOptions = OWNER_FILTER_OPTIONS;
  readonly skeletonRows = Array.from({ length: 8 });

  private rows = signal<EuroStatsRow[]>([]);
  readonly isReady = signal(false);
  readonly hasError = signal(false);
  private loadSub?: Subscription;

  private readonly both = computed(() => this.ownerService.current() === 'both');
  readonly kpis = computed(() => computeKpis(this.rows(), this.both()));
  readonly byCountry = computed(() => groupByCountry(this.rows(), this.both()));
  readonly byFaceValue = computed(() => groupByFaceValue(this.rows(), this.both()));
  readonly byYear = computed(() => groupByYear(this.rows(), this.both()));

  readonly subtitle = computed(
    () =>
      `${this.kpis().countries} ${this.literals.countriesCount} · ${this.format(this.kpis().total)} ${this.literals.coinsInCatalog}`,
  );

  /** "de 5.441" junto a la cifra de obtenidas. */
  readonly ofTotal = computed(() => `${this.literals.ofTotal} ${this.format(this.kpis().total)}`);
  readonly ofCommemorative = computed(
    () => `${this.literals.ofTotal} ${this.format(this.kpis().commemorativeTotal)}`,
  );
  readonly ofCountries = computed(() => `${this.literals.ofTotal} ${this.kpis().countries}`);
  readonly spareHint = computed(
    () => `${this.format(this.kpis().spareUnits)} ${this.literals.spareUnits}`,
  );
  readonly ownedPercent = computed(() => {
    const { owned, total } = this.kpis();
    return total > 0 ? `${Math.round((owned / total) * 100)} %` : '';
  });

  constructor() {
    // Recarga con skeleton al cambiar de colección (Darío / Manolo / ambas)
    effect(() => {
      this.ownerService.current();
      untracked(() => this.load());
    });
  }

  load(): void {
    this.hasError.set(false);
    this.isReady.set(false);
    // Solo cuenta la última petición: una anterior que llegue tarde no pisa los datos nuevos
    this.loadSub?.unsubscribe();
    this.loadSub = this.estadisticasService.getEuroStats().subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.isReady.set(true);
      },
      error: (e) => {
        this.errorHandler.handleError(e);
        this.hasError.set(true);
        this.isReady.set(true);
      },
    });
  }

  onOwnerChange(slug: string): void {
    this.ownerService.setOwner(slug as OwnerSlug);
  }

  private format(value: number): string {
    return formatNumber(value, 'es', '1.0-0');
  }
}
