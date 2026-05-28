import { Component, computed, effect, ErrorHandler, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { CollectionLayoutComponent } from '../../../../shared/components/collection-layout/collection-layout.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { EmptyPanelComponent } from '../../../../shared/components/empty-panel/empty-panel.component';
import { EurosService } from '../../services/euros.service';
import { AuthService } from '../../../../core/services/auth.service';
import { EuroCoin } from '../../../../shared/interfaces/euro-coin.interface';
import { LITERALS } from '../../../../shared/constants/literals';
import { normalizeString } from '../../../../shared/helpers/normalize-strings.helper';
import {
  restoreSearchQuery,
  saveSearchQuery,
} from '../../../../shared/helpers/search-state.helper';
import { getConservationBadge, getUdsBadge } from '../../../../shared/helpers/badge.helpers';
import { sortByFaceValue } from '../../constants/face-value-order.const';
import { MessageService } from 'primeng/api';
import { CoinUdsDialogComponent } from '../coin-uds-dialog/coin-uds-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { TOAST_MESSAGES } from '../../../../shared/constants/toast-messages.const';
import { ExcelExportService } from '../../../../shared/services/excel-export.service';
import { FilterPillsComponent } from '../../../../shared/components/filter-pills/filter-pills.component';
import { OWNERSHIP_FILTER_OPTIONS } from '../../../../shared/constants/ownership-filter.config';
import { OWNER_FILTER_OPTIONS } from '../../../../shared/constants/owner-filter.config';
import { OwnerService } from '../../../../core/services/owner.service';
import { OwnerSlug } from '../../../../shared/interfaces/owner.interface';

@Component({
  selector: 'app-euros-year-coins',
  imports: [
    CommonModule,
    TableModule,
    CollectionLayoutComponent,
    BadgeComponent,
    ButtonComponent,
    EmptyPanelComponent,
    CoinUdsDialogComponent,
    ConfirmDialogComponent,
    FilterPillsComponent,
  ],
  templateUrl: './euros-year-coins.component.html',
  styleUrl: './euros-year-coins.component.scss',
})
export class EurosYearCoinsComponent {
  private eurosService = inject(EurosService);
  private messageService = inject(MessageService);
  private excelExport = inject(ExcelExportService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private errorHandler = inject(ErrorHandler);
  readonly authService = inject(AuthService);
  readonly ownerService = inject(OwnerService);

  readonly literals = LITERALS.euros;
  readonly sharedLiterals = LITERALS.shared;
  readonly hasError = signal(false);

  readonly country = signal('');
  readonly year = signal<number | null>(null);
  private yearCoins = signal<EuroCoin[]>([]);
  readonly searchQuery = signal('');
  readonly isReady = signal(false);
  readonly dialogVisible = signal(false);
  readonly selectedCoin = signal<EuroCoin | null>(null);
  readonly deleteDialogVisible = signal(false);
  readonly selectedDeleteCoin = signal<EuroCoin | null>(null);
  readonly deleteLoading = signal(false);

  readonly ownershipFilter = signal('all');
  readonly filterOptions = OWNERSHIP_FILTER_OPTIONS;
  readonly ownerOptions = OWNER_FILTER_OPTIONS;

  constructor() {
    this.listenToRouteParams();
    this.setupReloadEffect();
  }

  private listenToRouteParams(): void {
    this.route.params.subscribe((params) => {
      const currentCountry = params['country'] || '';
      const currentYear = params['year'] ? parseInt(params['year'], 10) : null;
      this.country.set(currentCountry);
      this.year.set(currentYear);
      if (currentCountry && currentYear !== null) {
        this.searchQuery.set(
          restoreSearchQuery(`euros-year-coins-${currentCountry}-${currentYear}`),
        );
      }
    });
  }

  private setupReloadEffect(): void {
    effect(() => {
      const country = this.country();
      const year = this.year();
      this.ownerService.current();
      if (country && year !== null) {
        this.loadCoins(country, year);
      }
    });
  }

  loadCoins(country: string, year: number): void {
    this.hasError.set(false);
    this.isReady.set(false);
    this.eurosService.getByCountryAndYear(country, year).subscribe({
      next: (coins) => {
        this.yearCoins.set([...coins].sort(sortByFaceValue));
        this.isReady.set(true);
      },
      error: (e) => {
        this.errorHandler.handleError(e);
        this.hasError.set(true);
        this.isReady.set(true);
      },
    });
  }

  readonly coins = computed<EuroCoin[]>(() => {
    const ownership = this.ownershipFilter();
    let coins = this.yearCoins();
    if (ownership === 'owned') coins = coins.filter((c) => c.uds > 0);
    else if (ownership === 'missing') coins = coins.filter((c) => c.uds === 0);

    const query = normalizeString(this.searchQuery());
    if (!query) return coins;
    return coins.filter(
      (c) =>
        normalizeString(c.faceValue).includes(query) ||
        normalizeString(c.description).includes(query),
    );
  });

  readonly isAmbas = computed(() => this.ownerService.current() === 'ambas');

  readonly coinRows = computed(() =>
    this.coins().map((coin) => ({
      coin,
      conservationBadge: getConservationBadge(coin.conservation),
      udsBadge: getUdsBadge(coin.uds),
      conservationBadgeAlt: coin.conservationAlt
        ? getConservationBadge(coin.conservationAlt)
        : null,
      udsBadgeAlt: coin.udsAlt !== undefined ? getUdsBadge(coin.udsAlt) : null,
    })),
  );

  readonly hasMint = computed(() => this.yearCoins().some((c) => c.mint));
  readonly hasNonCirculating = computed(() => this.coins().some((c) => !c.circulation));

  readonly title = computed(() => {
    const currentYear = this.year();
    return currentYear ? currentYear.toString() : '';
  });

  readonly backLink = computed(() => {
    const currentCountry = this.country();
    return currentCountry ? ['/euros', currentCountry] : ['/euros'];
  });

  onSearch(query: string): void {
    this.searchQuery.set(query);
    saveSearchQuery(`euros-year-coins-${this.country()}-${this.year()}`, query);
  }

  onOwnerChange(slug: string): void {
    this.ownerService.setOwner(slug as OwnerSlug);
  }

  onCoinClick(coin: EuroCoin): void {
    this.router.navigate(['/euros', this.country(), this.year(), coin.id]);
  }

  onEditUnits(coin: EuroCoin): void {
    this.selectedCoin.set(coin);
    this.dialogVisible.set(true);
  }

  onDialogSaved(): void {
    this.loadCoins(this.country(), this.year()!);
  }

  onDialogClosed(): void {
    this.dialogVisible.set(false);
    this.selectedCoin.set(null);
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
      this.messageService.add({ ...TOAST_MESSAGES.euros.deleteSuccess, life: 3000 });
      this.onDeleteDialogClosed();
      this.loadCoins(this.country(), this.year()!);
    } catch (e) {
      this.errorHandler.handleError(e);
    } finally {
      this.deleteLoading.set(false);
    }
  }

  onDeleteDialogClosed(): void {
    this.deleteDialogVisible.set(false);
    this.selectedDeleteCoin.set(null);
  }

  async exportExcel(): Promise<void> {
    await this.excelExport.exportEurosYear(
      this.coins(),
      this.country(),
      this.year()!,
      this.hasMint(),
    );
  }
}
