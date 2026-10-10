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
import { CollectionPickerComponent } from '../../../../shared/components/collection-picker/collection-picker.component';
import { PageLayoutComponent } from '../../../../shared/components/page-layout/page-layout.component';
import { EmptyPanelComponent } from '../../../../shared/components/empty-panel/empty-panel.component';
import { ErrorPanelComponent } from '../../../../shared/components/error-panel/error-panel.component';
import { getEmptyState } from '../../../../shared/helpers/empty-state.helper';
import { ProgressStatComponent } from '../../../../shared/components/progress-stat/progress-stat.component';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import { EurosService } from '../../services/euros.service';
import { injectCan } from '../../../../core/services/permissions.service';
import { OwnerService } from '../../../../core/services/owner.service';
import { EuroCoinSummary } from '../../../../shared/interfaces/euro-coin.interface';
import { injectLiterals, I18nService } from '../../../../shared/services/i18n.service';
import { normalizeString } from '../../../../shared/helpers/normalize-strings.helper';
import {
  restoreSearchQuery,
  saveSearchQuery,
} from '../../../../shared/helpers/search-state.helper';
import {
  addToOwnedCount,
  countOwned,
  emptyOwnedCount,
  ownedBreakdown,
} from '../../../../shared/helpers/ownership.helper';
import {
  OwnedBreakdownItem,
  OwnedCount,
} from '../../../../shared/interfaces/owned-count.interface';
import { CountryNamePipe } from '../../../../shared/pipes/country-name.pipe';
import { matchesCountry } from '../../../../shared/helpers/country.helper';

interface CountryCard extends OwnedCount {
  country: string;
  minYear: number;
  maxYear: number;
  breakdown: OwnedBreakdownItem[];
}

const SEARCH_KEY = 'euros-countries';

@Component({
  selector: 'app-euros-countries',
  imports: [
    CollectionPickerComponent,
    CountryNamePipe,
    RouterLink,
    SkeletonComponent,
    CountryFlagComponent,
    PageLayoutComponent,
    EmptyPanelComponent,
    ErrorPanelComponent,
    ProgressStatComponent,
  ],
  templateUrl: './euros-countries.component.html',
  styleUrl: './euros-countries.component.scss',
})
export class EurosCountriesComponent {
  readonly lang = inject(I18nService).lang;
  private eurosService = inject(EurosService);
  private errorHandler = inject(ErrorHandler);
  readonly ownerService = inject(OwnerService);

  readonly literals = injectLiterals('euros');
  readonly sharedLiterals = injectLiterals('shared');
  private countries = injectLiterals('countries');
  readonly canSwitchCollection = injectCan('collection.switch');
  readonly skeletonCards = Array.from({ length: 12 });

  private summary = signal<EuroCoinSummary[]>([]);
  readonly searchQuery = signal(restoreSearchQuery(SEARCH_KEY));
  readonly emptyState = computed(() => getEmptyState(this.sharedLiterals(), this.searchQuery()));
  readonly isReady = signal(false);
  readonly hasError = signal(false);
  /** Colección cargada: si cambia se vuelve a mostrar el skeleton. */
  private loadedOwner: string | null = null;
  private loadSub?: Subscription;

  constructor() {
    // Recarga al cambiar de colección (o de colección comparada) o tras editar una moneda (sin skeleton)
    effect(() => {
      const owner = this.ownerService.selectionKey();
      this.eurosService.revision();
      if (owner === null) return;
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
    const comparing = this.ownerService.isComparing();
    const names = this.ownerService.comparedNames();
    const byCountry = new Map<string, CountryCard>();
    for (const coin of this.summary()) {
      const card = byCountry.get(coin.country) ?? {
        country: coin.country,
        minYear: coin.year,
        maxYear: coin.year,
        ...emptyOwnedCount(),
        breakdown: [],
      };
      card.minYear = Math.min(card.minYear, coin.year);
      card.maxYear = Math.max(card.maxYear, coin.year);
      addToOwnedCount(card, coin, comparing);
      byCountry.set(coin.country, card);
    }
    const cards = [...byCountry.values()];
    for (const card of cards) card.breakdown = ownedBreakdown(card, names);
    return cards.sort((a, b) => a.country.localeCompare(b.country, 'es'));
  });

  readonly countryCards = computed(() => {
    const query = normalizeString(this.searchQuery().trim());
    const cards = this.allCards();
    return query ? cards.filter((c) => matchesCountry(c.country, query, this.countries())) : cards;
  });

  readonly totals = computed(() => {
    const comparing = this.ownerService.isComparing();
    return countOwned(this.summary(), comparing);
  });
  readonly totalsBreakdown = computed(() =>
    ownedBreakdown(this.totals(), this.ownerService.comparedNames()),
  );

  readonly subtitle = computed(
    () =>
      `${this.allCards().length} ${this.literals().countriesCount} · ${formatNumber(this.totals().total, this.lang(), '1.0-0')} ${this.literals().coinsInCatalog}`,
  );

  onSearch(query: string): void {
    this.searchQuery.set(query);
    saveSearchQuery(SEARCH_KEY, query);
  }
}
