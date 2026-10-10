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
import { CollectionPickerComponent } from '../../../../shared/components/collection-picker/collection-picker.component';
import { PageLayoutComponent } from '../../../../shared/components/page-layout/page-layout.component';
import { ErrorPanelComponent } from '../../../../shared/components/error-panel/error-panel.component';
import { ProgressStatComponent } from '../../../../shared/components/progress-stat/progress-stat.component';
import { CountryFlagComponent } from '../../../../shared/components/country-flag/country-flag.component';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import { injectCan } from '../../../../core/services/permissions.service';
import { OwnerService } from '../../../../core/services/owner.service';
import { EuroStatsRow, StatGroup } from '../../../../shared/interfaces/euro-stats.interface';
import { ownedBreakdown } from '../../../../shared/helpers/ownership.helper';
import { injectLiterals, I18nService } from '../../../../shared/services/i18n.service';
import {
  computeKpis,
  groupByCountry,
  groupByFaceValue,
  groupByYear,
} from '../../../../shared/helpers/euro-stats.helper';
import { EstadisticasService } from '../../services/estadisticas.service';
import { StatCardComponent } from '../stat-card/stat-card.component';
import { YearChartComponent } from '../year-chart/year-chart.component';
import { CountryNamePipe } from '../../../../shared/pipes/country-name.pipe';
import { FaceValuePipe } from '../../../../shared/pipes/face-value.pipe';

@Component({
  selector: 'app-estadisticas-dashboard',
  imports: [
    CollectionPickerComponent,
    FaceValuePipe,
    CountryNamePipe,
    RouterLink,
    PageLayoutComponent,
    ErrorPanelComponent,
    ProgressStatComponent,
    CountryFlagComponent,
    SkeletonComponent,
    StatCardComponent,
    YearChartComponent,
  ],
  templateUrl: './estadisticas-dashboard.component.html',
  styleUrl: './estadisticas-dashboard.component.scss',
})
export class EstadisticasDashboardComponent {
  readonly lang = inject(I18nService).lang;
  private estadisticasService = inject(EstadisticasService);
  private errorHandler = inject(ErrorHandler);
  readonly ownerService = inject(OwnerService);

  readonly literals = injectLiterals('estadisticas');
  readonly sharedLiterals = injectLiterals('shared');
  readonly canSwitchCollection = injectCan('collection.switch');
  readonly skeletonRows = Array.from({ length: 8 });

  private rows = signal<EuroStatsRow[]>([]);
  readonly isReady = signal(false);
  readonly hasError = signal(false);
  private loadSub?: Subscription;

  private readonly both = computed(() => this.ownerService.isComparing());
  readonly kpis = computed(() => computeKpis(this.rows(), this.both()));
  readonly byCountry = computed(() => this.withBreakdown(groupByCountry(this.rows(), this.both())));
  readonly byFaceValue = computed(() =>
    this.withBreakdown(groupByFaceValue(this.rows(), this.both())),
  );
  readonly byYear = computed(() => groupByYear(this.rows(), this.both()));
  /** Al comparar: obtenidas por cada colección bajo el progreso conjunto. */
  readonly kpisBreakdown = computed(() =>
    ownedBreakdown(this.kpis(), this.ownerService.comparedNames()),
  );

  readonly subtitle = computed(
    () =>
      `${this.kpis().countries} ${this.literals().countriesCount} · ${this.format(this.kpis().total)} ${this.literals().coinsInCatalog}`,
  );

  /** "de 5.441" junto a la cifra de obtenidas. */
  readonly ofTotal = computed(() => `${this.literals().ofTotal} ${this.format(this.kpis().total)}`);
  readonly ofCommemorative = computed(
    () => `${this.literals().ofTotal} ${this.format(this.kpis().commemorativeTotal)}`,
  );
  readonly ofCountries = computed(() => `${this.literals().ofTotal} ${this.kpis().countries}`);
  readonly spareHint = computed(
    () => `${this.format(this.kpis().spareUnits)} ${this.literals().spareUnits}`,
  );
  /** Porcentaje y, al comparar, cuántas tiene cada colección ("46 % · Darío 2.535 · Manolo 0"). */
  readonly ownedHint = computed(() => {
    const { owned, total } = this.kpis();
    const percent = total > 0 ? `${Math.round((owned / total) * 100)} %` : '';
    const parts = this.kpisBreakdown().map((b) => `${b.label} ${this.format(b.owned)}`);
    return [percent, ...parts].filter(Boolean).join(' · ');
  });

  constructor() {
    // Recarga con skeleton al cambiar de colección (o de colección comparada)
    effect(() => {
      if (this.ownerService.selectionKey() === null) return;
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

  private withBreakdown(groups: StatGroup[]) {
    const names = this.ownerService.comparedNames();
    return groups.map((g) => ({ ...g, breakdown: ownedBreakdown(g, names) }));
  }

  private format(value: number): string {
    return formatNumber(value, this.lang(), '1.0-0');
  }
}
