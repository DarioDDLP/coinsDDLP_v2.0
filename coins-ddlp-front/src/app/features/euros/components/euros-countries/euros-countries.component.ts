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
import { CountryFlagComponent } from '../../../../shared/components/country-flag/country-flag.component';
import { PageLayoutComponent } from '../../../../shared/components/page-layout/page-layout.component';
import { EmptyPanelComponent } from '../../../../shared/components/empty-panel/empty-panel.component';
import { ErrorPanelComponent } from '../../../../shared/components/error-panel/error-panel.component';
import { getEmptyState } from '../../../../shared/helpers/empty-state.helper';
import { ProgressStatComponent } from '../../../../shared/components/progress-stat/progress-stat.component';
import { FilterPillsComponent } from '../../../../shared/components/filter-pills/filter-pills.component';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import { EurosService } from '../../services/euros.service';
import { OwnerService } from '../../../../core/services/owner.service';
import { EuroCoinSummary } from '../../../../shared/interfaces/euro-coin.interface';
import { OwnerSlug } from '../../../../shared/interfaces/owner.interface';
import { LITERALS } from '../../../../shared/constants/literals';
import { OWNER_FILTER_OPTIONS } from '../../../../shared/constants/owner-filter.config';
import { normalizeString } from '../../../../shared/helpers/normalize-strings.helper';
import {
  restoreSearchQuery,
  saveSearchQuery,
} from '../../../../shared/helpers/search-state.helper';
import { isOwned } from '../../../../shared/helpers/ownership.helper';

interface CountryCard {
  country: string;
  minYear: number;
  maxYear: number;
  owned: number;
  total: number;
}

const SEARCH_KEY = 'euros-countries';

@Component({
  selector: 'app-euros-countries',
  imports: [
    RouterLink,
    SkeletonComponent,
    CountryFlagComponent,
    PageLayoutComponent,
    EmptyPanelComponent,
    ErrorPanelComponent,
    ProgressStatComponent,
    FilterPillsComponent,
  ],
  templateUrl: './euros-countries.component.html',
  styleUrl: './euros-countries.component.scss',
})
export class EurosCountriesComponent {
  private eurosService = inject(EurosService);
  private errorHandler = inject(ErrorHandler);
  readonly ownerService = inject(OwnerService);

  readonly literals = LITERALS.euros;
  readonly sharedLiterals = LITERALS.shared;
  readonly ownerOptions = OWNER_FILTER_OPTIONS;
  readonly skeletonCards = Array.from({ length: 12 });

  private summary = signal<EuroCoinSummary[]>([]);
  readonly searchQuery = signal(restoreSearchQuery(SEARCH_KEY));
  readonly emptyState = computed(() => getEmptyState(this.searchQuery()));
  readonly isReady = signal(false);
  readonly hasError = signal(false);
  /** Colección cargada: si cambia se vuelve a mostrar el skeleton. */
  private loadedOwner: string | null = null;
  private loadSub?: Subscription;

  constructor() {
    // Recarga al cambiar de colección (Darío / Manolo / ambas) o tras editar una moneda (sin skeleton)
    effect(() => {
      const owner = this.ownerService.current();
      this.eurosService.revision();
      untracked(() => {
        this.loadSummary(owner !== this.loadedOwner);
        this.loadedOwner = owner;
      });
    });
  }

  loadSummary(showSkeleton = true): void {
    this.hasError.set(false);
    if (showSkeleton) this.isReady.set(false);
    // Solo cuenta la última petición: una anterior que llegue tarde no pisa los datos nuevos
    this.loadSub?.unsubscribe();
    this.loadSub = this.eurosService.getCatalogSummary().subscribe({
      next: (rows) => {
        this.summary.set(rows);
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

  private readonly allCards = computed<CountryCard[]>(() => {
    const both = this.ownerService.current() === 'both';
    const byCountry = new Map<string, CountryCard>();
    for (const coin of this.summary()) {
      const card = byCountry.get(coin.country) ?? {
        country: coin.country,
        minYear: coin.year,
        maxYear: coin.year,
        owned: 0,
        total: 0,
      };
      card.minYear = Math.min(card.minYear, coin.year);
      card.maxYear = Math.max(card.maxYear, coin.year);
      card.total++;
      if (isOwned(coin.uds, coin.udsAlt, both)) card.owned++;
      byCountry.set(coin.country, card);
    }
    return [...byCountry.values()].sort((a, b) => a.country.localeCompare(b.country, 'es'));
  });

  readonly countryCards = computed(() => {
    const query = normalizeString(this.searchQuery().trim());
    const cards = this.allCards();
    return query ? cards.filter((c) => normalizeString(c.country).includes(query)) : cards;
  });

  readonly totals = computed(() =>
    this.allCards().reduce(
      (acc, c) => ({ owned: acc.owned + c.owned, total: acc.total + c.total }),
      { owned: 0, total: 0 },
    ),
  );

  readonly subtitle = computed(
    () =>
      `${this.allCards().length} ${this.literals.countriesCount} · ${formatNumber(this.totals().total, 'es', '1.0-0')} ${this.literals.coinsInCatalog}`,
  );

  onSearch(query: string): void {
    this.searchQuery.set(query);
    saveSearchQuery(SEARCH_KEY, query);
  }

  onOwnerChange(slug: string): void {
    this.ownerService.setOwner(slug as OwnerSlug);
  }
}
