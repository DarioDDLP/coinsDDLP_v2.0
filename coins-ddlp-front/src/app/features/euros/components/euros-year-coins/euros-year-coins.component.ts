import { Component, computed, ErrorHandler, inject, signal, OnInit } from '@angular/core';
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
import { getConservationBadge, getUdsBadge } from '../../../../shared/helpers/badge.helpers';
import { sortByFaceValue } from '../../constants/face-value-order.const';

@Component({
  selector: 'app-euros-year-coins',
  imports: [CommonModule, TableModule, CollectionLayoutComponent, BadgeComponent, ButtonComponent, EmptyPanelComponent],
  templateUrl: './euros-year-coins.component.html',
  styleUrl: './euros-year-coins.component.scss',
})
export class EurosYearCoinsComponent implements OnInit {
  private eurosService = inject(EurosService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private errorHandler = inject(ErrorHandler);
  readonly authService = inject(AuthService);

  readonly literals = LITERALS.euros;
  readonly sharedLiterals = LITERALS.shared;
  readonly hasError = signal(false);

  readonly country = signal('');
  readonly year = signal<number | null>(null);
  private yearCoins = signal<EuroCoin[]>([]);
  readonly searchQuery = signal('');
  readonly isReady = signal(false);

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const currentCountry = params['country'] || '';
      const currentYear = params['year'] ? parseInt(params['year'], 10) : null;

      this.country.set(currentCountry);
      this.year.set(currentYear);

      if (currentCountry && currentYear !== null) {
        this.loadCoins(currentCountry, currentYear);
      }
    });
  }

  loadCoins(country: string, year: number): void {
    this.hasError.set(false);
    this.isReady.set(false);
    this.eurosService.getByCountryAndYear(country, year).subscribe({
      next: coins => { this.yearCoins.set([...coins].sort(sortByFaceValue)); this.isReady.set(true); },
      error: (e) => { this.errorHandler.handleError(e); this.hasError.set(true); this.isReady.set(true); },
    });
  }

  readonly coins = computed<EuroCoin[]>(() => {
    const query = normalizeString(this.searchQuery());
    if (!query) return this.yearCoins();
    return this.yearCoins().filter(c =>
      normalizeString(c.faceValue).includes(query) ||
      normalizeString(c.description).includes(query)
    );
  });

  readonly coinRows = computed(() =>
    this.coins().map(coin => ({
      coin,
      conservationBadge: getConservationBadge(coin.conservation),
      udsBadge: getUdsBadge(coin.uds),
    }))
  );

  readonly hasMint = computed(() => this.yearCoins().some(c => c.mint));
  readonly hasNonCirculating = computed(() => this.coins().some(c => !c.circulation));

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
  }

  onCoinClick(coin: EuroCoin): void {
    this.router.navigate(['/euros', this.country(), this.year(), coin.id]);
  }
}
