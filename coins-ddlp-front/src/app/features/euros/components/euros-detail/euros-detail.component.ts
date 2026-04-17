import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { CollectionLayoutComponent } from '../../../../shared/components/collection-layout/collection-layout.component';
import { CoinBadgeComponent } from '../../../../shared/components/coin-badge/coin-badge.component';
import { UnitBadgeComponent } from '../../../../shared/components/unit-badge/unit-badge.component';
import { EurosService } from '../../services/euros.service';
import { EuroCoin } from '../../../../shared/interfaces/euro-coin.interface';
import { LITERALS } from '../../../../shared/constants/literals';
import { normalizeString } from '../../../../shared/helpers/normalize-strings.helper';
import { sortByFaceValue } from '../../constants/face-value-order.const';

@Component({
  selector: 'app-euros-detail',
  standalone: true,
  imports: [CommonModule, TableModule, CollectionLayoutComponent, CoinBadgeComponent, UnitBadgeComponent],
  templateUrl: './euros-detail.component.html',
  styleUrl: './euros-detail.component.scss',
})
export class EurosDetailComponent implements OnInit {
  private eurosService = inject(EurosService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly literals = LITERALS.euros;

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

  private loadCoins(country: string, year: number): void {
    this.isReady.set(false);
    this.eurosService.getByCountryAndYear(country, year).subscribe(coins => {
      this.yearCoins.set([...coins].sort(sortByFaceValue));
      this.isReady.set(true);
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
